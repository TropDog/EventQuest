import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CoordinatorModule } from '../coordinator/coordinator.module';
import { EventsModule } from '../events/events.module';
import { PlayersModule } from '../players/players.module';
import { EventPlayerGuard } from './guards/event-player.guard';
import { TeamsController } from './teams.controller';
import { TeamsRepository } from './teams.repository';
import { TeamsService } from './teams.service';

@Module({
  imports: [AuthModule, EventsModule, CoordinatorModule, PlayersModule],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsRepository, EventPlayerGuard],
  exports: [TeamsService, TeamsRepository],
})
export class TeamsModule {}
