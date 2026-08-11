import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentOrganizer } from '../../common/decorators/current-organizer.decorator';
import { CurrentPlayer } from '../../common/decorators/current-player.decorator';
import type { OrganizerJwtPayload } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventOwnerGuard } from '../events/guards/event-owner.guard';
import { PlayerSessionGuard } from '../players/guards/player-session.guard';
import { PlayerSessionPayload } from '../players/player.types';
import { ChangeTeamNameDto } from './dto/change-team-name.dto';
import { ConfigureTeamsDto } from './dto/configure-teams.dto';
import { EventPlayerGuard } from './guards/event-player.guard';
import { TeamsService } from './teams.service';

type AuthorizedRequest = {
  headers: { authorization?: string };
};

@Controller('events/:eventId/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  listTeams(
    @Param('eventId') eventId: string,
    @Req() request: AuthorizedRequest,
  ) {
    return this.teamsService.listTeamsForRequest(eventId, request);
  }

  @Put()
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  configureTeams(
    @Param('eventId') eventId: string,
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Body() dto: ConfigureTeamsDto,
  ) {
    return this.teamsService.configureTeams(organizer.sub, eventId, dto);
  }

  @Post(':teamId/join')
  @UseGuards(PlayerSessionGuard, EventPlayerGuard)
  joinTeam(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @CurrentPlayer() player: PlayerSessionPayload,
  ) {
    return this.teamsService.joinTeam(eventId, teamId, player.playerId);
  }

  @Patch(':teamId/name')
  @UseGuards(PlayerSessionGuard, EventPlayerGuard)
  changeTeamName(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @CurrentPlayer() player: PlayerSessionPayload,
    @Body() dto: ChangeTeamNameDto,
  ) {
    return this.teamsService.changeTeamName(
      eventId,
      teamId,
      player.playerId,
      dto.name,
    );
  }
}
