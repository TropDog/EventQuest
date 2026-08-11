import type { PlayerProfile } from './player-profile.js';

/**
 * Public team summary returned by team endpoints.
 */
export interface TeamSummary {
  id: string;
  eventId: string;
  name: string;
  defaultNumber: number;
  maxPlayers: number;
  nameChanged: boolean;
  playerCount: number;
  availableSpots: number;
  isFull: boolean;
}

export interface ListTeamsResponse {
  teams: TeamSummary[];
}

export interface ConfigureTeamsResponse {
  teams: TeamSummary[];
}

export interface JoinTeamResponse {
  player: PlayerProfile;
}

export interface ChangeTeamNameResponse {
  team: TeamSummary;
}
