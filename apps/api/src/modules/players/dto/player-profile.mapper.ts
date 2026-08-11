import { Event, Player } from '@prisma/client';
import type { JoinEventContext, PlayerProfile } from '@eventquest/shared';
import { EventStatus, GameMode } from '@eventquest/shared';

export function toPlayerProfile(player: Player): PlayerProfile {
  return {
    id: player.id,
    eventId: player.eventId,
    teamId: player.teamId,
    nickname: player.nickname,
    avatarUrl: player.avatarUrl,
    termsAcceptedAt: player.termsAcceptedAt.toISOString(),
    joinedAt: player.joinedAt.toISOString(),
    lastSeenAt: player.lastSeenAt?.toISOString() ?? null,
  };
}

export function toJoinEventContext(
  event: Event,
  playerCount: number,
): JoinEventContext {
  return {
    id: event.id,
    name: event.name,
    status: event.status as EventStatus,
    gameMode: event.gameMode as GameMode,
    participantLimit: event.participantLimit,
    playerCount,
  };
}
