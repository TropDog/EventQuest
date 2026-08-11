import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventStatus, GameMode, Player } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type LockedEventRow = {
  id: string;
  status: EventStatus;
  participant_limit: number | null;
};

@Injectable()
export class PlayersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEventByRoomCode(roomCode: string): Promise<Event | null> {
    return this.prisma.event.findFirst({
      where: { roomCode },
    });
  }

  findEventById(eventId: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  countPlayersByEventId(eventId: string): Promise<number> {
    return this.prisma.player.count({
      where: { eventId },
    });
  }

  async createPlayerIfJoinAllowed(data: {
    eventId: string;
    nickname: string;
    guestTokenHash: string;
    termsAcceptedAt: Date;
    joinedAt: Date;
    avatarUrl?: string;
  }): Promise<Player> {
    return this.prisma.$transaction(async (tx) => {
      const lockedEvents = await tx.$queryRaw<LockedEventRow[]>`
        SELECT id, status, participant_limit
        FROM events
        WHERE id = ${data.eventId}
        FOR UPDATE
      `;

      const lockedEvent = lockedEvents[0];
      if (!lockedEvent) {
        throw new NotFoundException('Event not found');
      }

      if (!isEventJoinable(lockedEvent.status)) {
        throw new ConflictException('Event is not open for joining');
      }

      const playerCount = await tx.player.count({
        where: { eventId: data.eventId },
      });

      if (
        isParticipantLimitReached(playerCount, lockedEvent.participant_limit)
      ) {
        throw new ConflictException(
          'Event participant limit has been reached',
        );
      }

      return tx.player.create({
        data: {
          eventId: data.eventId,
          nickname: data.nickname,
          guestTokenHash: data.guestTokenHash,
          termsAcceptedAt: data.termsAcceptedAt,
          joinedAt: data.joinedAt,
          avatarUrl: data.avatarUrl,
        },
      });
    });
  }

  findPlayerByGuestTokenHash(
    guestTokenHash: string,
  ): Promise<(Player & { event: Event }) | null> {
    return this.prisma.player.findUnique({
      where: { guestTokenHash },
      include: { event: true },
    });
  }

  findPlayerById(playerId: string): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: { id: playerId },
    });
  }

  updatePlayerAvatar(
    playerId: string,
    avatarUrl: string | null,
  ): Promise<Player> {
    return this.prisma.player.update({
      where: { id: playerId },
      data: { avatarUrl },
    });
  }
}

export const JOINABLE_EVENT_STATUSES: EventStatus[] = [EventStatus.ACTIVE];

export function isEventJoinable(status: EventStatus): boolean {
  return JOINABLE_EVENT_STATUSES.includes(status);
}

export function isParticipantLimitReached(
  playerCount: number,
  participantLimit: number | null,
): boolean {
  if (participantLimit === null) {
    return false;
  }

  return playerCount >= participantLimit;
}

export function isTeamModeRequired(gameMode: GameMode): boolean {
  return gameMode === GameMode.TEAMS;
}
