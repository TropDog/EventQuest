import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import type {
  JoinEventResponse,
  PlayerProfile,
  ResolveJoinResponse,
  UpdatePlayerAvatarResponse,
} from '@eventquest/shared';
import {
  generateOpaqueToken,
  hashToken,
} from '../../common/utils/token-hash';
import { JoinPlayerDto } from './dto/join-player.dto';
import { toJoinEventContext, toPlayerProfile } from './dto/player-profile.mapper';
import {
  isEventJoinable,
  isParticipantLimitReached,
  PlayersRepository,
} from './players.repository';
import { PlayerSessionPayload } from './player.types';

export type { PlayerSessionPayload };

@Injectable()
export class PlayersService {
  constructor(private readonly playersRepository: PlayersRepository) {}

  async resolveJoinByRoomCode(roomCode: string): Promise<ResolveJoinResponse> {
    const event = await this.playersRepository.findEventByRoomCode(roomCode);
    if (!event) {
      throw new NotFoundException('Room not found');
    }

    await this.assertEventJoinable(event.id, event.status, event.participantLimit);

    const playerCount = await this.playersRepository.countPlayersByEventId(
      event.id,
    );

    return {
      event: toJoinEventContext(event, playerCount),
    };
  }

  async joinEvent(
    eventId: string,
    dto: JoinPlayerDto,
  ): Promise<JoinEventResponse> {
    const event = await this.playersRepository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const guestToken = generateOpaqueToken();
    const guestTokenHash = hashToken(guestToken);
    const now = new Date();

    const player = await this.playersRepository.createPlayerIfJoinAllowed({
      eventId,
      nickname: dto.nickname.trim(),
      guestTokenHash,
      termsAcceptedAt: now,
      joinedAt: now,
      avatarUrl: dto.avatarUrl,
    });

    return {
      player: toPlayerProfile(player),
      guestToken,
    };
  }

  async getCurrentPlayer(playerId: string): Promise<PlayerProfile> {
    const player = await this.playersRepository.findPlayerById(playerId);
    if (!player) {
      throw new UnauthorizedException('Invalid guest session token');
    }

    return toPlayerProfile(player);
  }

  async updateAvatar(
    playerId: string,
    avatarUrl: string | null | undefined,
  ): Promise<UpdatePlayerAvatarResponse> {
    const player = await this.playersRepository.findPlayerById(playerId);
    if (!player) {
      throw new UnauthorizedException('Invalid guest session token');
    }

    const updatedPlayer = await this.playersRepository.updatePlayerAvatar(
      playerId,
      avatarUrl ?? null,
    );

    return {
      player: toPlayerProfile(updatedPlayer),
    };
  }

  async validateGuestSession(token: string): Promise<PlayerSessionPayload> {
    const guestTokenHash = hashToken(token);
    const player =
      await this.playersRepository.findPlayerByGuestTokenHash(guestTokenHash);

    if (!player) {
      throw new UnauthorizedException('Invalid guest session token');
    }

    return {
      playerId: player.id,
      eventId: player.eventId,
      type: 'player',
    };
  }

  private async assertEventJoinable(
    eventId: string,
    status: EventStatus,
    participantLimit: number | null,
  ): Promise<void> {
    if (!isEventJoinable(status)) {
      throw new ConflictException('Event is not open for joining');
    }

    const playerCount =
      await this.playersRepository.countPlayersByEventId(eventId);

    if (isParticipantLimitReached(playerCount, participantLimit)) {
      throw new ConflictException('Event participant limit has been reached');
    }
  }
}
