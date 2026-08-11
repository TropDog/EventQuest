import { Team } from '@prisma/client';
import type { TeamSummary } from '@eventquest/shared';

export function toTeamSummary(
  team: Team,
  playerCount: number,
): TeamSummary {
  const availableSpots = Math.max(team.maxPlayers - playerCount, 0);

  return {
    id: team.id,
    eventId: team.eventId,
    name: team.name,
    defaultNumber: team.defaultNumber,
    maxPlayers: team.maxPlayers,
    nameChanged: team.nameChanged,
    playerCount,
    availableSpots,
    isFull: availableSpots === 0,
  };
}
