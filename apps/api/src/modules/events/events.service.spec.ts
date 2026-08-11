import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { EventStatus, GameMode, PaymentStatus } from '@eventquest/shared';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { PackagesService } from '../packages/packages.service';
import * as roomCodeUtils from './utils/room-code';

describe('EventsService', () => {
  let service: EventsService;
  let eventsRepository: jest.Mocked<EventsRepository>;
  let packagesService: jest.Mocked<PackagesService>;
  let configService: jest.Mocked<ConfigService>;

  const baseEvent = {
    id: 'event-1',
    organizerId: 'org-1',
    packagePurchaseId: 'purchase-1',
    name: 'Wedding Quest',
    eventType: 'wedding',
    roomCode: 'ABC123',
    status: EventStatus.DRAFT,
    gameMode: GameMode.SOLO,
    participantLimit: 60,
    startsAt: null,
    closesAt: null,
    closedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    eventsRepository = {
      findEventById: jest.fn(),
      findEventsByOrganizerId: jest.fn(),
      findOrganizerEvent: jest.fn(),
      roomCodeExists: jest.fn(),
      createEventWithPackageConsumption: jest.fn(),
      updateEvent: jest.fn(),
      openEvent: jest.fn(),
      closeEvent: jest.fn(),
      closeExpiredActiveEvents: jest.fn(),
    } as unknown as jest.Mocked<EventsRepository>;

    packagesService = {
      assertPackageAvailableForEventCreation: jest.fn(),
    } as unknown as jest.Mocked<PackagesService>;

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'app.frontendBaseUrl') {
          return 'http://localhost:3000';
        }
        if (key === 'app.eventAutoCloseDays') {
          return 7;
        }
        return defaultValue;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new EventsService(
      eventsRepository,
      packagesService,
      configService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates an event from a paid package and marks the package as used', async () => {
    packagesService.assertPackageAvailableForEventCreation.mockResolvedValue({
      id: 'purchase-1',
      packageType: 'BASIC',
      participantLimit: 60,
      paymentStatus: PaymentStatus.PAID,
      paymentProvider: 'placeholder',
      purchasedAt: '2026-01-01T00:00:00.000Z',
      usedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    eventsRepository.roomCodeExists.mockResolvedValue(false);
    eventsRepository.createEventWithPackageConsumption.mockResolvedValue(
      baseEvent as never,
    );

    const response = await service.createEvent('org-1', {
      packagePurchaseId: 'purchase-1',
      name: 'Wedding Quest',
      eventType: 'wedding',
    });

    expect(response.event.status).toBe(EventStatus.DRAFT);
    expect(response.event.participantLimit).toBe(60);
    expect(response.event.roomCode).toBe('ABC123');
  });

  it('retries event creation when the room code unique constraint collides', async () => {
    packagesService.assertPackageAvailableForEventCreation.mockResolvedValue({
      id: 'purchase-1',
      packageType: 'FREE',
      participantLimit: 20,
      paymentStatus: PaymentStatus.PAID,
      paymentProvider: 'placeholder',
      purchasedAt: '2026-01-01T00:00:00.000Z',
      usedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const roomCodeCollision = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`room_code`)',
      {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['room_code'] },
      },
    );

    jest
      .spyOn(roomCodeUtils, 'generateRoomCode')
      .mockReturnValueOnce('COLLIDE')
      .mockReturnValueOnce('UNIQUE2');

    eventsRepository.createEventWithPackageConsumption
      .mockRejectedValueOnce(roomCodeCollision)
      .mockResolvedValueOnce({
        ...baseEvent,
        roomCode: 'UNIQUE2',
      } as never);

    const response = await service.createEvent('org-1', {
      packagePurchaseId: 'purchase-1',
      name: 'Wedding Quest',
      eventType: 'wedding',
    });

    expect(response.event.roomCode).toBe('UNIQUE2');
    expect(eventsRepository.createEventWithPackageConsumption).toHaveBeenCalledTimes(
      2,
    );
  });

  it('does not retry unrelated unique constraint violations', async () => {
    packagesService.assertPackageAvailableForEventCreation.mockResolvedValue({
      id: 'purchase-1',
      packageType: 'FREE',
      participantLimit: 20,
      paymentStatus: PaymentStatus.PAID,
      paymentProvider: 'placeholder',
      purchasedAt: '2026-01-01T00:00:00.000Z',
      usedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const packageCollision = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`package_purchase_id`)',
      {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['package_purchase_id'] },
      },
    );

    eventsRepository.createEventWithPackageConsumption.mockRejectedValue(
      packageCollision,
    );

    await expect(
      service.createEvent('org-1', {
        packagePurchaseId: 'purchase-1',
        name: 'Wedding Quest',
        eventType: 'wedding',
      }),
    ).rejects.toBe(packageCollision);

    expect(eventsRepository.createEventWithPackageConsumption).toHaveBeenCalledTimes(
      1,
    );
  });

  it('rejects configuration updates once the event is active', async () => {
    eventsRepository.findOrganizerEvent.mockResolvedValue({
      ...baseEvent,
      status: EventStatus.ACTIVE,
    } as never);

    await expect(
      service.updateEvent('org-1', 'event-1', { name: 'Updated Name' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows DRAFT to CONFIGURED when explicitly requested', async () => {
    eventsRepository.findOrganizerEvent.mockResolvedValue(baseEvent as never);
    eventsRepository.updateEvent.mockResolvedValue({
      ...baseEvent,
      status: EventStatus.CONFIGURED,
    } as never);

    const response = await service.updateEvent('org-1', 'event-1', {
      status: EventStatus.CONFIGURED,
    });

    expect(response.event.status).toBe(EventStatus.CONFIGURED);
  });

  it('opens a configured event and sets automatic close date seven days after start', async () => {
    eventsRepository.findOrganizerEvent.mockResolvedValue({
      ...baseEvent,
      status: EventStatus.CONFIGURED,
    } as never);
    eventsRepository.findEventById.mockResolvedValue({
      ...baseEvent,
      status: EventStatus.CONFIGURED,
    } as never);
    eventsRepository.openEvent.mockResolvedValue({
      ...baseEvent,
      status: EventStatus.ACTIVE,
      startsAt: new Date('2026-02-01T18:00:00.000Z'),
      closesAt: new Date('2026-02-08T18:00:00.000Z'),
    } as never);

    const response = await service.openEvent('org-1', 'event-1');

    expect(response.event.status).toBe(EventStatus.ACTIVE);
    expect(eventsRepository.openEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-1',
        closesAt: expect.any(Date),
      }),
    );
  });

  it('rejects opening an event that is not configured', async () => {
    eventsRepository.findOrganizerEvent.mockResolvedValue(baseEvent as never);
    eventsRepository.findEventById.mockResolvedValue(baseEvent as never);

    await expect(service.openEvent('org-1', 'event-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('closes an active event', async () => {
    eventsRepository.findOrganizerEvent.mockResolvedValue({
      ...baseEvent,
      status: EventStatus.ACTIVE,
    } as never);
    eventsRepository.closeEvent.mockResolvedValue({
      ...baseEvent,
      status: EventStatus.CLOSED,
      closedAt: new Date('2026-02-02T00:00:00.000Z'),
    } as never);

    const response = await service.closeEvent('org-1', 'event-1');

    expect(response.event.status).toBe(EventStatus.CLOSED);
  });

  it('returns join URL and QR data for organizer-owned events', async () => {
    eventsRepository.findEventById.mockResolvedValue(baseEvent as never);

    const response = await service.getEventQr('event-1');

    expect(response.roomCode).toBe('ABC123');
    expect(response.joinUrl).toBe('http://localhost:3000/join/ABC123');
    expect(response.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('rejects unknown organizer events', async () => {
    eventsRepository.findOrganizerEvent.mockResolvedValue(null);

    await expect(service.getOrganizerEvent('org-1', 'event-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects invalid configured status requests', async () => {
    eventsRepository.findOrganizerEvent.mockResolvedValue(baseEvent as never);

    await expect(
      service.updateEvent('org-1', 'event-1', {
        status: EventStatus.ACTIVE as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closes expired active events through repository batch update', async () => {
    eventsRepository.closeExpiredActiveEvents.mockResolvedValue(2);

    await expect(service.closeExpiredEvents()).resolves.toBe(2);
  });
});
