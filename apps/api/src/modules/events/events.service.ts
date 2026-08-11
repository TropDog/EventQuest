import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event, EventStatus, GameMode } from '@prisma/client';
import type {
  CloseEventResponse,
  CreateEventResponse,
  EventQrResponse,
  GetEventResponse,
  ListEventsResponse,
  OpenEventResponse,
  UpdateEventResponse,
} from '@eventquest/shared';
import { EventStatus as SharedEventStatus } from '@eventquest/shared';
import { PackagesService } from '../packages/packages.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/create-event.dto';
import { toEventSummary } from './dto/event.mapper';
import {
  canTransition,
  isEventEditable,
} from './event-state-machine';
import { EventsRepository } from './events.repository';
import {
  buildJoinUrl,
  generateRoomCode,
  MAX_GENERATION_ATTEMPTS,
} from './utils/room-code';
import { buildQrCodeDataUrl } from './utils/qr-code';
import { isRoomCodeUniqueViolation } from './utils/prisma-errors';

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly packagesService: PackagesService,
    private readonly configService: ConfigService,
  ) {}

  async createEvent(
    organizerId: string,
    dto: CreateEventDto,
  ): Promise<CreateEventResponse> {
    const purchase = await this.packagesService.assertPackageAvailableForEventCreation(
      organizerId,
      dto.packagePurchaseId,
    );

    const usedAt = new Date();

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const roomCode = generateRoomCode();

      try {
        const event =
          await this.eventsRepository.createEventWithPackageConsumption({
            organizerId,
            packagePurchaseId: dto.packagePurchaseId,
            name: dto.name.trim(),
            eventType: dto.eventType.trim(),
            roomCode,
            gameMode: dto.gameMode ?? GameMode.SOLO,
            participantLimit: purchase.participantLimit,
            usedAt,
          });

        return { event: toEventSummary(event) };
      } catch (error) {
        if (isRoomCodeUniqueViolation(error)) {
          continue;
        }

        if (error instanceof Error && error.message === 'PACKAGE_NOT_AVAILABLE') {
          throw new BadRequestException(
            'Package purchase is not available for event creation',
          );
        }

        throw error;
      }
    }

    throw new ConflictException('Unable to generate a unique room code');
  }

  async listOrganizerEvents(organizerId: string): Promise<ListEventsResponse> {
    const events = await this.eventsRepository.findEventsByOrganizerId(
      organizerId,
    );

    return {
      events: events.map(toEventSummary),
    };
  }

  async getOrganizerEvent(
    organizerId: string,
    eventId: string,
  ): Promise<GetEventResponse> {
    const event = await this.findOwnedEvent(organizerId, eventId);
    return { event: toEventSummary(event) };
  }

  async updateEvent(
    organizerId: string,
    eventId: string,
    dto: UpdateEventDto,
  ): Promise<UpdateEventResponse> {
    const event = await this.findOwnedEvent(organizerId, eventId);

    if (!isEventEditable(event.status as SharedEventStatus)) {
      throw new ConflictException(
        'Event configuration cannot be changed in the current status',
      );
    }

    const nextStatus = this.resolveConfiguredStatus(event, dto);
    const startsAt = this.parseOptionalDate(dto.startsAt, 'startsAt');

    const updated = await this.eventsRepository.updateEvent(eventId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.eventType !== undefined
        ? { eventType: dto.eventType.trim() }
        : {}),
      ...(dto.gameMode !== undefined ? { gameMode: dto.gameMode } : {}),
      ...(startsAt !== undefined ? { startsAt } : {}),
      ...(nextStatus !== undefined ? { status: nextStatus } : {}),
    });

    return { event: toEventSummary(updated) };
  }

  async openEvent(
    organizerId: string,
    eventId: string,
  ): Promise<OpenEventResponse> {
    await this.findOwnedEvent(organizerId, eventId);

    const existing = await this.eventsRepository.findEventById(eventId);
    if (!existing) {
      throw new NotFoundException('Event not found');
    }

    if (
      !canTransition(
        existing.status as SharedEventStatus,
        SharedEventStatus.ACTIVE,
      )
    ) {
      throw new ConflictException('Event cannot be opened in the current status');
    }

    const startsAt = existing.startsAt ?? new Date();
    const closesAt = this.calculateClosesAt(startsAt);

    const opened = await this.eventsRepository.openEvent({
      eventId,
      startsAt,
      closesAt,
    });

    if (!opened) {
      throw new ConflictException('Event cannot be opened in the current status');
    }

    return { event: toEventSummary(opened) };
  }

  async closeEvent(
    organizerId: string,
    eventId: string,
  ): Promise<CloseEventResponse> {
    await this.findOwnedEvent(organizerId, eventId);

    const closedAt = new Date();
    const closed = await this.eventsRepository.closeEvent(eventId, closedAt);

    if (!closed) {
      throw new ConflictException('Event cannot be closed in the current status');
    }

    return { event: toEventSummary(closed) };
  }

  async getEventQr(
    eventId: string,
    actorEventId?: string,
  ): Promise<EventQrResponse> {
    if (actorEventId && actorEventId !== eventId) {
      throw new NotFoundException('Event not found');
    }

    const event = await this.eventsRepository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const joinUrl = buildJoinUrl(
      this.configService.get<string>('app.frontendBaseUrl', 'http://localhost:3000'),
      event.roomCode,
    );
    const qrCodeDataUrl = await buildQrCodeDataUrl(joinUrl);

    return {
      roomCode: event.roomCode,
      joinUrl,
      qrCodeDataUrl,
    };
  }

  async closeExpiredEvents(referenceDate = new Date()): Promise<number> {
    return this.eventsRepository.closeExpiredActiveEvents(referenceDate);
  }

  private async findOwnedEvent(
    organizerId: string,
    eventId: string,
  ): Promise<Event> {
    const event = await this.eventsRepository.findOrganizerEvent(
      organizerId,
      eventId,
    );

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  private resolveConfiguredStatus(
    event: Event,
    dto: UpdateEventDto,
  ): EventStatus | undefined {
    if (dto.status === undefined) {
      return undefined;
    }

    if (dto.status !== SharedEventStatus.CONFIGURED) {
      throw new BadRequestException('Only CONFIGURED status can be set explicitly');
    }

    if (
      !canTransition(
        event.status as SharedEventStatus,
        SharedEventStatus.CONFIGURED,
      )
    ) {
      throw new ConflictException(
        'Event cannot be marked as configured in the current status',
      );
    }

    const nextGameMode = dto.gameMode ?? event.gameMode;
    if (!nextGameMode) {
      throw new BadRequestException('Game mode is required before configuring');
    }

    return EventStatus.CONFIGURED;
  }

  private parseOptionalDate(
    value: string | undefined,
    fieldName: string,
  ): Date | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return parsed;
  }

  private calculateClosesAt(startsAt: Date): Date {
    const autoCloseDays = this.configService.get<number>(
      'app.eventAutoCloseDays',
      7,
    );
    const closesAt = new Date(startsAt);
    closesAt.setDate(closesAt.getDate() + autoCloseDays);
    return closesAt;
  }
}
