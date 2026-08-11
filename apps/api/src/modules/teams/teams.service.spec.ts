import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  Event,
  EventStatus,
  GameMode,
  Player,
  Team,
} from '@prisma/client';
import { CoordinatorService } from '../coordinator/coordinator.service';
import { PlayersRepository } from '../players/players.repository';
import { TeamsRepository } from './teams.repository';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let teamsService: TeamsService;
  let teamsRepository: jest.Mocked<TeamsRepository>;
  let playersRepository: jest.Mocked<PlayersRepository>;

  const event: Event = {
    id: 'event-1',
    organizerId: 'org-1',
    packagePurchaseId: 'purchase-1',
    name: 'Team Event',
    eventType: 'wedding',
    roomCode: 'TEAM123',
    status: EventStatus.ACTIVE,
    gameMode: GameMode.TEAMS,
    participantLimit: 100,
    startsAt: null,
    closesAt: null,
    closedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const team: Team = {
    id: 'team-1',
    eventId: 'event-1',
    name: 'Team 1',
    defaultNumber: 1,
    maxPlayers: 4,
    nameChanged: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const player: Player = {
    id: 'player-1',
    eventId: 'event-1',
    teamId: 'team-1',
    nickname: 'GuestOne',
    avatarUrl: null,
    guestTokenHash: 'hash',
    termsAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastSeenAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    teamsRepository = {
      findEventById: jest.fn(),
      findOrganizerEvent: jest.fn(),
      findTeamsWithPlayerCounts: jest.fn(),
      findTeamById: jest.fn(),
      countPlayersAssignedToTeams: jest.fn(),
      configureTeamsForEvent: jest.fn(),
      joinTeamIfCapacityAllowed: jest.fn(),
      changeTeamNameIfAllowed: jest.fn(),
    } as unknown as jest.Mocked<TeamsRepository>;

    playersRepository = {
      countPlayersByTeamId: jest.fn(),
      findPlayerByGuestTokenHash: jest.fn(),
    } as unknown as jest.Mocked<PlayersRepository>;

    teamsService = new TeamsService(
      teamsRepository,
      playersRepository,
      {} as CoordinatorService,
      {} as JwtService,
      {} as ConfigService,
    );
  });

  describe('listTeams', () => {
    it('returns teams with capacity metadata for public join access', async () => {
      teamsRepository.findEventById.mockResolvedValue(event);
      teamsRepository.findTeamsWithPlayerCounts.mockResolvedValue([
        { ...team, _count: { players: 2 } },
      ]);

      const result = await teamsService.listTeams('event-1', { type: 'public' });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0]).toMatchObject({
        id: 'team-1',
        playerCount: 2,
        availableSpots: 2,
        isFull: false,
      });
    });

    it('rejects listing teams for solo mode events', async () => {
      teamsRepository.findEventById.mockResolvedValue({
        ...event,
        gameMode: GameMode.SOLO,
      });

      await expect(
        teamsService.listTeams('event-1', { type: 'public' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('configureTeams', () => {
    it('creates teams for an organizer-owned team mode event', async () => {
      teamsRepository.findOrganizerEvent.mockResolvedValue(event);
      teamsRepository.configureTeamsForEvent.mockResolvedValue([team]);

      const result = await teamsService.configureTeams('org-1', 'event-1', {
        teamCount: 1,
        maxPlayersPerTeam: 4,
      });

      expect(result.teams[0].name).toBe('Team 1');
      expect(teamsRepository.configureTeamsForEvent).toHaveBeenCalledWith({
        eventId: 'event-1',
        teamCount: 1,
        maxPlayersPerTeam: 4,
      });
    });

    it('rejects configuration for events not owned by the organizer', async () => {
      teamsRepository.findOrganizerEvent.mockResolvedValue(null);

      await expect(
        teamsService.configureTeams('other-org', 'event-1', {
          teamCount: 2,
          maxPlayersPerTeam: 4,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('joinTeam', () => {
    it('returns the updated player profile after joining a team', async () => {
      teamsRepository.joinTeamIfCapacityAllowed.mockResolvedValue(player);

      const result = await teamsService.joinTeam(
        'event-1',
        'team-1',
        'player-1',
      );

      expect(result.player.teamId).toBe('team-1');
    });
  });

  describe('changeTeamName', () => {
    it('returns the updated team summary after a one-time rename', async () => {
      teamsRepository.changeTeamNameIfAllowed.mockResolvedValue({
        ...team,
        name: 'Dream Team',
        nameChanged: true,
      });
      playersRepository.countPlayersByTeamId.mockResolvedValue(3);

      const result = await teamsService.changeTeamName(
        'event-1',
        'team-1',
        'player-1',
        'Dream Team',
      );

      expect(result.team.name).toBe('Dream Team');
      expect(result.team.nameChanged).toBe(true);
      expect(result.team.playerCount).toBe(3);
    });

    it('rejects empty team names', async () => {
      await expect(
        teamsService.changeTeamName('event-1', 'team-1', 'player-1', '   '),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
