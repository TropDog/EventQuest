import {
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoordinatorAccess, Event, EventStatus, GameMode } from '@prisma/client';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorRepository } from './coordinator.repository';
import { hashToken } from '../../common/utils/token-hash';

describe('CoordinatorService', () => {
  let coordinatorService: CoordinatorService;
  let coordinatorRepository: jest.Mocked<CoordinatorRepository>;
  let configService: jest.Mocked<ConfigService>;

  const event: Event = {
    id: 'event-1',
    organizerId: 'org-1',
    packagePurchaseId: 'purchase-1',
    name: 'Test Event',
    eventType: 'wedding',
    roomCode: 'ROOM123',
    status: EventStatus.DRAFT,
    gameMode: GameMode.SOLO,
    participantLimit: 100,
    startsAt: null,
    closesAt: null,
    closedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const access: CoordinatorAccess = {
    id: 'access-1',
    eventId: 'event-1',
    tokenHash: hashToken('valid-token'),
    isActive: true,
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    coordinatorRepository = {
      findEventById: jest.fn(),
      createCoordinatorAccess: jest.fn(),
      findCoordinatorAccessById: jest.fn(),
      findCoordinatorAccessByHash: jest.fn(),
      revokeCoordinatorAccess: jest.fn(),
    } as unknown as jest.Mocked<CoordinatorRepository>;

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'coordinator.accessExpiresInDays') {
          return 30;
        }
        return defaultValue;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    coordinatorService = new CoordinatorService(
      coordinatorRepository,
      configService,
    );
  });

  describe('createCoordinatorAccess', () => {
    it('creates hashed coordinator access and returns the raw token once', async () => {
      coordinatorRepository.findEventById.mockResolvedValue(event);
      coordinatorRepository.createCoordinatorAccess.mockResolvedValue(access);

      const result = await coordinatorService.createCoordinatorAccess(
        'org-1',
        'event-1',
      );

      expect(result.token).toBeDefined();
      expect(result.coordinatorAccess.id).toBe('access-1');
      expect(
        (result.coordinatorAccess as { tokenHash?: string }).tokenHash,
      ).toBeUndefined();

      const createCall =
        coordinatorRepository.createCoordinatorAccess.mock.calls[0][0];
      expect(createCall.tokenHash).toBe(hashToken(result.token));
      expect(createCall.tokenHash).not.toBe(result.token);
    });

    it('rejects access creation for events not owned by the organizer', async () => {
      coordinatorRepository.findEventById.mockResolvedValue({
        ...event,
        organizerId: 'other-org',
      });

      await expect(
        coordinatorService.createCoordinatorAccess('org-1', 'event-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('revokeCoordinatorAccess', () => {
    it('revokes coordinator access for an owned event', async () => {
      coordinatorRepository.findEventById.mockResolvedValue(event);
      coordinatorRepository.findCoordinatorAccessById.mockResolvedValue(access);
      coordinatorRepository.revokeCoordinatorAccess.mockResolvedValue({
        ...access,
        isActive: false,
        revokedAt: new Date(),
      });

      const result = await coordinatorService.revokeCoordinatorAccess(
        'org-1',
        'event-1',
        'access-1',
      );

      expect(result.success).toBe(true);
      expect(coordinatorRepository.revokeCoordinatorAccess).toHaveBeenCalledWith(
        'access-1',
      );
    });
  });

  describe('resolveCoordinatorAccess', () => {
    it('returns coordinator event context for a valid token', async () => {
      coordinatorRepository.findCoordinatorAccessByHash.mockResolvedValue({
        ...access,
        event,
      });

      const result =
        await coordinatorService.resolveCoordinatorAccess('valid-token');

      expect(result.coordinatorAccess.eventId).toBe('event-1');
      expect(result.event.id).toBe('event-1');
      expect(result.event.roomCode).toBe('ROOM123');
    });

    it('rejects invalid tokens', async () => {
      coordinatorRepository.findCoordinatorAccessByHash.mockResolvedValue(null);

      await expect(
        coordinatorService.resolveCoordinatorAccess('invalid-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects expired tokens', async () => {
      coordinatorRepository.findCoordinatorAccessByHash.mockResolvedValue({
        ...access,
        expiresAt: new Date(Date.now() - 60_000),
        event,
      });

      await expect(
        coordinatorService.resolveCoordinatorAccess('valid-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects revoked tokens', async () => {
      coordinatorRepository.findCoordinatorAccessByHash.mockResolvedValue({
        ...access,
        isActive: false,
        revokedAt: new Date(),
        event,
      });

      await expect(
        coordinatorService.resolveCoordinatorAccess('valid-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('validateCoordinatorToken', () => {
    it('returns coordinator payload for authorized access', async () => {
      coordinatorRepository.findCoordinatorAccessByHash.mockResolvedValue({
        ...access,
        event,
      });

      const payload =
        await coordinatorService.validateCoordinatorToken('valid-token');

      expect(payload).toEqual({
        accessId: 'access-1',
        eventId: 'event-1',
        type: 'coordinator',
      });
    });
  });
});
