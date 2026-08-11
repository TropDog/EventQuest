import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventStatus, GameMode, Player, Team } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EventStatus as SharedEventStatus } from '@eventquest/shared';
import { isEventEditable } from '../events/event-state-machine';

type LockedTeamRow = {
  id: string;
  event_id: string;
  max_players: number;
  name_changed: boolean;
};

type LockedPlayerRow = {
  id: string;
  event_id: string;
  team_id: string | null;
};

@Injectable()
export class TeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEventById(eventId: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  findOrganizerEvent(
    organizerId: string,
    eventId: string,
  ): Promise<Event | null> {
    return this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
    });
  }

  findTeamsWithPlayerCounts(eventId: string): Promise<
    Array<Team & { _count: { players: number } }>
  > {
    return this.prisma.team.findMany({
      where: { eventId },
      include: {
        _count: {
          select: { players: true },
        },
      },
      orderBy: { defaultNumber: 'asc' },
    });
  }

  findTeamById(teamId: string): Promise<Team | null> {
    return this.prisma.team.findUnique({
      where: { id: teamId },
    });
  }

  countPlayersAssignedToTeams(eventId: string): Promise<number> {
    return this.prisma.player.count({
      where: {
        eventId,
        teamId: { not: null },
      },
    });
  }

  async configureTeamsForEvent(data: {
    eventId: string;
    teamCount: number;
    maxPlayersPerTeam: number;
  }): Promise<Team[]> {
    return this.prisma.$transaction(async (tx) => {
      const lockedEvents = await tx.$queryRaw<
        Array<{ id: string; game_mode: GameMode; status: EventStatus }>
      >`
        SELECT id, game_mode, status
        FROM events
        WHERE id = ${data.eventId}
        FOR UPDATE
      `;

      const lockedEvent = lockedEvents[0];
      if (!lockedEvent) {
        throw new NotFoundException('Event not found');
      }

      if (lockedEvent.game_mode !== GameMode.TEAMS) {
        throw new ConflictException('Event is not in team mode');
      }

      if (!isEventEditable(lockedEvent.status as SharedEventStatus)) {
        throw new ConflictException(
          'Teams can only be configured while the event is editable',
        );
      }

      const assignedPlayers = await tx.player.count({
        where: {
          eventId: data.eventId,
          teamId: { not: null },
        },
      });

      if (assignedPlayers > 0) {
        throw new ConflictException(
          'Cannot reconfigure teams while players are assigned',
        );
      }

      await tx.team.deleteMany({
        where: { eventId: data.eventId },
      });

      await tx.team.createMany({
        data: Array.from({ length: data.teamCount }, (_, index) => ({
          eventId: data.eventId,
          name: `Team ${index + 1}`,
          defaultNumber: index + 1,
          maxPlayers: data.maxPlayersPerTeam,
        })),
      });

      return tx.team.findMany({
        where: { eventId: data.eventId },
        orderBy: { defaultNumber: 'asc' },
      });
    });
  }

  async joinTeamIfCapacityAllowed(data: {
    eventId: string;
    teamId: string;
    playerId: string;
  }): Promise<Player> {
    return this.prisma.$transaction(async (tx) => {
      const lockedTeams = await tx.$queryRaw<LockedTeamRow[]>`
        SELECT id, event_id, max_players, name_changed
        FROM teams
        WHERE id = ${data.teamId}
        FOR UPDATE
      `;

      const lockedTeam = lockedTeams[0];
      if (!lockedTeam || lockedTeam.event_id !== data.eventId) {
        throw new NotFoundException('Team not found');
      }

      const lockedPlayers = await tx.$queryRaw<LockedPlayerRow[]>`
        SELECT id, event_id, team_id
        FROM players
        WHERE id = ${data.playerId}
        FOR UPDATE
      `;

      const lockedPlayer = lockedPlayers[0];
      if (!lockedPlayer || lockedPlayer.event_id !== data.eventId) {
        throw new NotFoundException('Player not found');
      }

      if (lockedPlayer.team_id) {
        throw new ConflictException('Player is already on a team');
      }

      const lockedEvents = await tx.$queryRaw<
        Array<{ id: string; game_mode: GameMode; status: EventStatus }>
      >`
        SELECT id, game_mode, status
        FROM events
        WHERE id = ${data.eventId}
        FOR UPDATE
      `;

      const lockedEvent = lockedEvents[0];
      if (!lockedEvent) {
        throw new NotFoundException('Event not found');
      }

      if (lockedEvent.game_mode !== GameMode.TEAMS) {
        throw new ConflictException('Event is not in team mode');
      }

      if (!isEventJoinable(lockedEvent.status)) {
        throw new ConflictException('Event is not open for team joining');
      }

      const playerCount = await tx.player.count({
        where: { teamId: data.teamId },
      });

      if (playerCount >= lockedTeam.max_players) {
        throw new ConflictException('Team is full');
      }

      return tx.player.update({
        where: { id: data.playerId },
        data: { teamId: data.teamId },
      });
    });
  }

  async changeTeamNameIfAllowed(data: {
    eventId: string;
    teamId: string;
    playerId: string;
    name: string;
  }): Promise<Team> {
    return this.prisma.$transaction(async (tx) => {
      const lockedTeams = await tx.$queryRaw<LockedTeamRow[]>`
        SELECT id, event_id, max_players, name_changed
        FROM teams
        WHERE id = ${data.teamId}
        FOR UPDATE
      `;

      const lockedTeam = lockedTeams[0];
      if (!lockedTeam || lockedTeam.event_id !== data.eventId) {
        throw new NotFoundException('Team not found');
      }

      if (lockedTeam.name_changed) {
        throw new ConflictException('Team name has already been changed');
      }

      const player = await tx.player.findFirst({
        where: {
          id: data.playerId,
          eventId: data.eventId,
          teamId: data.teamId,
        },
      });

      if (!player) {
        throw new NotFoundException('Team not found');
      }

      return tx.team.update({
        where: { id: data.teamId },
        data: {
          name: data.name,
          nameChanged: true,
        },
      });
    });
  }
}

export const JOINABLE_EVENT_STATUSES: EventStatus[] = [EventStatus.ACTIVE];

export function isEventJoinable(status: EventStatus): boolean {
  return JOINABLE_EVENT_STATUSES.includes(status);
}
