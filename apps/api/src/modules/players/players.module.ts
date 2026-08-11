import { Module } from '@nestjs/common';
import {
  EventPlayersController,
  JoinController,
  PlayersController,
} from './players.controller';
import { PlayersService } from './players.service';
import { PlayersRepository } from './players.repository';
import { PlayerSessionGuard } from './guards/player-session.guard';

@Module({
  controllers: [JoinController, EventPlayersController, PlayersController],
  providers: [PlayersService, PlayersRepository, PlayerSessionGuard],
  exports: [PlayersService, PlayerSessionGuard],
})
export class PlayersModule {}
