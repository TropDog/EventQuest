import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Event, GameMode } from '@prisma/client';
import type {
  ChangeTeamNameResponse,
  ConfigureTeamsResponse,
  JoinTeamResponse,
  ListTeamsResponse,
} from '@eventquest/shared';
import type { OrganizerJwtPayload } from '../auth/strategies/jwt.strategy';
import { hashToken } from '../../common/utils/token-hash';
import { CoordinatorService } from '../coordinator/coordinator.service';
import { toPlayerProfile } from '../players/dto/player-profile.mapper';
import { PlayersRepository } from '../players/players.repository';
import { ConfigureTeamsDto } from './dto/configure-teams.dto';
import { toTeamSummary } from './dto/team.mapper';
import { isEventJoinable, TeamsRepository } from './teams.repository';
import type { TeamsAccessContext } from './teams.types';

type TeamsListRequest = {
  headers: { authorization?: string };
};

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamsRepository: TeamsRepository,
    private readonly playersRepository: PlayersRepository,
    private readonly coordinatorService: CoordinatorService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async listTeamsForRequest(
    eventId: string,
    request: TeamsListRequest,
  ): Promise<ListTeamsResponse> {
    const accessContext = await this.resolveTeamsAccessContext(
      eventId,
      request,
    );
    return this.listTeams(eventId, accessContext);
  }

  async listTeams(
    eventId: string,
    accessContext: TeamsAccessContext,
  ): Promise<ListTeamsResponse> {
    const event = await this.assertTeamsListAccess(eventId, accessContext);
    this.assertTeamMode(event);

    const teams = await this.teamsRepository.findTeamsWithPlayerCounts(eventId);

    return {
      teams: teams.map((team) =>
        toTeamSummary(team, team._count.players),
      ),
    };
  }

  async configureTeams(
    organizerId: string,
    eventId: string,
    dto: ConfigureTeamsDto,
  ): Promise<ConfigureTeamsResponse> {
    const event = await this.teamsRepository.findOrganizerEvent(
      organizerId,
      eventId,
    );
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    this.assertTeamMode(event);

    const teams = await this.teamsRepository.configureTeamsForEvent({
      eventId,
      teamCount: dto.teamCount,
      maxPlayersPerTeam: dto.maxPlayersPerTeam,
    });

    return {
      teams: teams.map((team) => toTeamSummary(team, 0)),
    };
  }

  async joinTeam(
    eventId: string,
    teamId: string,
    playerId: string,
  ): Promise<JoinTeamResponse> {
    const player = await this.teamsRepository.joinTeamIfCapacityAllowed({
      eventId,
      teamId,
      playerId,
    });

    return {
      player: toPlayerProfile(player),
    };
  }

  async changeTeamName(
    eventId: string,
    teamId: string,
    playerId: string,
    name: string,
  ): Promise<ChangeTeamNameResponse> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Team name is required');
    }

    const team = await this.teamsRepository.changeTeamNameIfAllowed({
      eventId,
      teamId,
      playerId,
      name: trimmedName,
    });

    const playerCount = await this.playersRepository.countPlayersByTeamId(
      team.id,
    );

    return {
      team: toTeamSummary(team, playerCount),
    };
  }

  async resolveTeamsAccessContext(
    eventId: string,
    request: TeamsListRequest,
  ): Promise<TeamsAccessContext> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { type: 'public' };
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return { type: 'public' };
    }

    const organizer = await this.tryResolveOrganizer(token);
    if (organizer) {
      return { type: 'organizer', organizerId: organizer.sub };
    }

    const coordinator = await this.tryResolveCoordinator(token);
    if (coordinator) {
      if (coordinator.eventId !== eventId) {
        throw new NotFoundException('Event not found');
      }

      return { type: 'coordinator', eventId: coordinator.eventId };
    }

    const player = await this.tryResolvePlayer(token);
    if (player) {
      if (player.eventId !== eventId) {
        throw new NotFoundException('Event not found');
      }

      return {
        type: 'player',
        eventId: player.eventId,
        playerId: player.playerId,
      };
    }

    throw new UnauthorizedException('Authentication required');
  }

  private async assertTeamsListAccess(
    eventId: string,
    accessContext: TeamsAccessContext,
  ): Promise<Event> {
    const event = await this.teamsRepository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    switch (accessContext.type) {
      case 'organizer': {
        if (event.organizerId !== accessContext.organizerId) {
          throw new NotFoundException('Event not found');
        }
        return event;
      }
      case 'coordinator':
      case 'player': {
        if (event.id !== accessContext.eventId) {
          throw new NotFoundException('Event not found');
        }
        return event;
      }
      case 'public': {
        if (!isEventJoinable(event.status)) {
          throw new NotFoundException('Event not found');
        }
        return event;
      }
      default:
        throw new NotFoundException('Event not found');
    }
  }

  private assertTeamMode(event: Event): void {
    if (event.gameMode !== GameMode.TEAMS) {
      throw new BadRequestException('Event is not in team mode');
    }
  }

  private async tryResolveOrganizer(
    token: string,
  ): Promise<OrganizerJwtPayload | null> {
    try {
      const secret = this.configService.get<string>('jwt.accessSecret');
      if (!secret) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync<OrganizerJwtPayload>(
        token,
        { secret },
      );

      if (payload.type !== 'access') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private async tryResolveCoordinator(token: string) {
    try {
      return await this.coordinatorService.validateCoordinatorToken(token);
    } catch {
      return null;
    }
  }

  private async tryResolvePlayer(token: string) {
    try {
      const guestTokenHash = hashToken(token);
      const player =
        await this.playersRepository.findPlayerByGuestTokenHash(guestTokenHash);

      if (!player) {
        return null;
      }

      return {
        playerId: player.id,
        eventId: player.eventId,
      };
    } catch {
      return null;
    }
  }
}
