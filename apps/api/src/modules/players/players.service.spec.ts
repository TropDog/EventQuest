import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Event,
  EventStatus,
  GameMode,
  Player,
} from '@prisma/client';
import { PlayersService } from './players.service';
import { PlayersRepository } from './players.repository';
import { hashToken } from '../../common/utils/token-hash';

describe('PlayersService', () => {
  let playersService: PlayersService;
  let playersRepository: jest.Mocked<PlayersRepository>;

  const event: Event = {
    id: 'event-1',
    organizerId: 'org-1',
    packagePurchaseId: 'purchase-1',
    name: 'Test Event',
    eventType: 'wedding',
    roomCode: 'ROOM123',
    status: EventStatus.ACTIVE,
    gameMode: GameMode.SOLO,
    participantLimit: 100,
    startsAt: null,
    closesAt: null,
    closedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const player: Player = {
    id: 'player-1',
    eventId: 'event-1',
    teamId: null,
    nickname: 'GuestOne',
    avatarUrl: null,
    guestTokenHash: hashToken('guest-token'),
    termsAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastSeenAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    playersRepository = {
      findEventByRoomCode: jest.fn(),
      findEventById: jest.fn(),
      countPlayersByEventId: jest.fn(),
      createPlayerIfJoinAllowed: jest.fn(),
      findPlayerByGuestTokenHash: jest.fn(),
      findPlayerById: jest.fn(),
      updatePlayerAvatar: jest.fn(),
    } as unknown as jest.Mocked<PlayersRepository>;

    playersService = new PlayersService(playersRepository);
  });

  describe('resolveJoinByRoomCode', () => {
    it('returns join context for a joinable room', async () => {
      playersRepository.findEventByRoomCode.mockResolvedValue(event);
      playersRepository.countPlayersByEventId.mockResolvedValue(5);

      const result = await playersService.resolveJoinByRoomCode('ROOM123');

      expect(result.event.id).toBe('event-1');
      expect(result.event.playerCount).toBe(5);
    });

    it('rejects unknown room codes', async () => {
      playersRepository.findEventByRoomCode.mockResolvedValue(null);

      await expect(
        playersService.resolveJoinByRoomCode('UNKNOWN'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects closed events', async () => {
      playersRepository.findEventByRoomCode.mockResolvedValue({
        ...event,
        status: EventStatus.CLOSED,
      });

      await expect(
        playersService.resolveJoinByRoomCode('ROOM123'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('joinEvent', () => {
    it('creates a player with hashed guest token and returns the raw token once', async () => {
      playersRepository.findEventById.mockResolvedValue(event);
      playersRepository.createPlayerIfJoinAllowed.mockResolvedValue(player);

      const result = await playersService.joinEvent('event-1', {
        nickname: 'GuestOne',
        termsAccepted: true,
      });

      expect(result.guestToken).toBeDefined();
      expect(result.player.nickname).toBe('GuestOne');
      expect(
        (result.player as { guestTokenHash?: string }).guestTokenHash,
      ).toBeUndefined();

      const createCall =
        playersRepository.createPlayerIfJoinAllowed.mock.calls[0][0];
      expect(createCall.guestTokenHash).toBe(hashToken(result.guestToken));
      expect(createCall.guestTokenHash).not.toBe(result.guestToken);
    });

    it('rejects team mode events until team selection is implemented', async () => {
      playersRepository.findEventById.mockResolvedValue({
        ...event,
        gameMode: GameMode.TEAMS,
      });

      await expect(
        playersService.joinEvent('event-1', {
          nickname: 'GuestOne',
          termsAccepted: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(playersRepository.createPlayerIfJoinAllowed).not.toHaveBeenCalled();
    });
  });

  describe('validateGuestSession', () => {
    it('returns player session payload for a valid token', async () => {
      playersRepository.findPlayerByGuestTokenHash.mockResolvedValue({
        ...player,
        event,
      });

      const payload =
        await playersService.validateGuestSession('guest-token');

      expect(payload).toEqual({
        playerId: 'player-1',
        eventId: 'event-1',
        type: 'player',
      });
    });

    it('rejects invalid guest tokens', async () => {
      playersRepository.findPlayerByGuestTokenHash.mockResolvedValue(null);

      await expect(
        playersService.validateGuestSession('invalid-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
