import { CoordinatorAccess } from '@prisma/client';
import type {
  CoordinatorAccessProfile,
  CoordinatorEventContext,
} from '@eventquest/shared';
import { EventStatus } from '@eventquest/shared';

export function toCoordinatorAccessProfile(
  access: CoordinatorAccess,
): CoordinatorAccessProfile {
  return {
    id: access.id,
    eventId: access.eventId,
    expiresAt: access.expiresAt?.toISOString() ?? null,
    createdAt: access.createdAt.toISOString(),
  };
}

export function toCoordinatorEventContext(event: {
  id: string;
  name: string;
  status: string;
  roomCode: string;
}): CoordinatorEventContext {
  return {
    id: event.id,
    name: event.name,
    status: event.status as EventStatus,
    roomCode: event.roomCode,
  };
}
