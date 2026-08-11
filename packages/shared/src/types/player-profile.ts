import type { EventStatus } from '../enums/event-status.enum.js';
import type { GameMode } from '../enums/game-mode.enum.js';

/**
 * Public player identity returned by player endpoints.
 * Must not include guest token hashes or other sensitive data.
 */
export interface PlayerProfile {
  id: string;
  eventId: string;
  teamId: string | null;
  nickname: string;
  avatarUrl: string | null;
  termsAcceptedAt: string;
  joinedAt: string;
  lastSeenAt: string | null;
}

export interface JoinEventContext {
  id: string;
  name: string;
  status: EventStatus;
  gameMode: GameMode;
  participantLimit: number | null;
  playerCount: number;
}

export interface ResolveJoinResponse {
  event: JoinEventContext;
}

export interface JoinEventResponse {
  player: PlayerProfile;
  guestToken: string;
}

export interface UpdatePlayerAvatarResponse {
  player: PlayerProfile;
}
