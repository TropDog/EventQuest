import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { JoinPlayerDto } from './dto/join-player.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { PlayerSessionGuard } from './guards/player-session.guard';
import { CurrentPlayer } from '../../common/decorators/current-player.decorator';
import { PlayerSessionPayload } from './player.types';

@Controller('join')
export class JoinController {
  constructor(private readonly playersService: PlayersService) {}

  @Get(':roomCode')
  @HttpCode(HttpStatus.OK)
  resolveRoom(@Param('roomCode') roomCode: string) {
    return this.playersService.resolveJoinByRoomCode(roomCode);
  }
}

@Controller('events/:eventId/players')
export class EventPlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  joinEvent(@Param('eventId') eventId: string, @Body() dto: JoinPlayerDto) {
    return this.playersService.joinEvent(eventId, dto);
  }
}

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('me')
  @UseGuards(PlayerSessionGuard)
  getMe(@CurrentPlayer() player: PlayerSessionPayload) {
    return this.playersService.getCurrentPlayer(player.playerId);
  }

  @Patch('me/avatar')
  @UseGuards(PlayerSessionGuard)
  updateAvatar(
    @CurrentPlayer() player: PlayerSessionPayload,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.playersService.updateAvatar(player.playerId, dto.avatarUrl);
  }
}
