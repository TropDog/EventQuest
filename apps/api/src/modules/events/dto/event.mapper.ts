import { Event } from '@prisma/client';
import type { EventSummary } from '@eventquest/shared';
import { EventStatus, GameMode } from '@eventquest/shared';

export function toEventSummary(event: Event): EventSummary {
  return {
    id: event.id,
    organizerId: event.organizerId,
    packagePurchaseId: event.packagePurchaseId,
    name: event.name,
    eventType: event.eventType,
    roomCode: event.roomCode,
    status: event.status as EventStatus,
    gameMode: event.gameMode as GameMode,
    participantLimit: event.participantLimit,
    startsAt: event.startsAt?.toISOString() ?? null,
    closesAt: event.closesAt?.toISOString() ?? null,
    closedAt: event.closedAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
