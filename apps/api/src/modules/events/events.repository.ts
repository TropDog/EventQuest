import { Injectable } from '@nestjs/common';
import { Event, EventStatus, Prisma } from '@prisma/client';
import { PaymentStatus } from '@eventquest/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEventById(eventId: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  findEventsByOrganizerId(organizerId: string): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOrganizerEvent(
    organizerId: string,
    eventId: string,
  ): Promise<Event | null> {
    return this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });
  }

  roomCodeExists(roomCode: string): Promise<boolean> {
    return this.prisma.event
      .findUnique({
        where: { roomCode },
        select: { id: true },
      })
      .then((event) => event !== null);
  }

  async createEventWithPackageConsumption(data: {
    organizerId: string;
    packagePurchaseId: string;
    name: string;
    eventType: string;
    roomCode: string;
    gameMode: Event['gameMode'];
    participantLimit: number | null;
    usedAt: Date;
  }): Promise<Event> {
    return this.prisma.$transaction(async (tx) => {
      const updatedPurchases = await tx.packagePurchase.updateMany({
        where: {
          id: data.packagePurchaseId,
          organizerId: data.organizerId,
          paymentStatus: PaymentStatus.PAID,
          usedAt: null,
        },
        data: {
          paymentStatus: PaymentStatus.USED,
          usedAt: data.usedAt,
        },
      });

      if (updatedPurchases.count !== 1) {
        throw new Error('PACKAGE_NOT_AVAILABLE');
      }

      return tx.event.create({
        data: {
          organizerId: data.organizerId,
          packagePurchaseId: data.packagePurchaseId,
          name: data.name,
          eventType: data.eventType,
          roomCode: data.roomCode,
          status: EventStatus.DRAFT,
          gameMode: data.gameMode,
          participantLimit: data.participantLimit,
        },
      });
    });
  }

  updateEvent(
    eventId: string,
    data: Prisma.EventUpdateInput,
  ): Promise<Event> {
    return this.prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  async openEvent(params: {
    eventId: string;
    startsAt: Date;
    closesAt: Date;
  }): Promise<Event | null> {
    const result = await this.prisma.event.updateMany({
      where: {
        id: params.eventId,
        status: EventStatus.CONFIGURED,
      },
      data: {
        status: EventStatus.ACTIVE,
        startsAt: params.startsAt,
        closesAt: params.closesAt,
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.findEventById(params.eventId);
  }

  async closeEvent(eventId: string, closedAt: Date): Promise<Event | null> {
    const result = await this.prisma.event.updateMany({
      where: {
        id: eventId,
        status: EventStatus.ACTIVE,
      },
      data: {
        status: EventStatus.CLOSED,
        closedAt,
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.findEventById(eventId);
  }

  async closeExpiredActiveEvents(closedAt: Date): Promise<number> {
    const result = await this.prisma.event.updateMany({
      where: {
        status: EventStatus.ACTIVE,
        closesAt: {
          lte: closedAt,
        },
      },
      data: {
        status: EventStatus.CLOSED,
        closedAt,
      },
    });

    return result.count;
  }
}
