import type { EventStatus } from '../enums/event-status.enum.js';

/**
 * Public coordinator access identity returned by coordinator endpoints.
 * Must not include token hashes or other sensitive data.
 */
export interface CoordinatorAccessProfile {
  id: string;
  eventId: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface CoordinatorEventContext {
  id: string;
  name: string;
  status: EventStatus;
  roomCode: string;
}

export interface CreateCoordinatorAccessResponse {
  coordinatorAccess: CoordinatorAccessProfile;
  token: string;
}

export interface ResolveCoordinatorAccessResponse {
  coordinatorAccess: CoordinatorAccessProfile;
  event: CoordinatorEventContext;
}

export interface RevokeCoordinatorAccessResponse {
  success: true;
}
