import type { EventStatus } from '../enums/event-status.enum.js';
import type { GameMode } from '../enums/game-mode.enum.js';

/**
 * Public event summary returned by organizer event endpoints.
 * Must not expose internal-only fields.
 */
export interface EventSummary {
  id: string;
  organizerId: string;
  packagePurchaseId: string;
  name: string;
  eventType: string;
  roomCode: string;
  status: EventStatus;
  gameMode: GameMode;
  participantLimit: number | null;
  startsAt: string | null;
  closesAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventResponse {
  event: EventSummary;
}

export interface ListEventsResponse {
  events: EventSummary[];
}

export interface GetEventResponse {
  event: EventSummary;
}

export interface UpdateEventResponse {
  event: EventSummary;
}

export interface OpenEventResponse {
  event: EventSummary;
}

export interface CloseEventResponse {
  event: EventSummary;
}

export interface EventQrResponse {
  roomCode: string;
  joinUrl: string;
  qrCodeDataUrl: string;
}
