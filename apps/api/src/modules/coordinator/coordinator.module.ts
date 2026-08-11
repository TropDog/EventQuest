import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import {
  CoordinatorAccessController,
  CoordinatorController,
} from './coordinator.controller';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorRepository } from './coordinator.repository';
import { EventOwnerGuard } from '../events/guards/event-owner.guard';
import { CoordinatorAccessGuard } from './guards/coordinator-access.guard';

@Module({
  imports: [AuthModule, forwardRef(() => EventsModule)],
  controllers: [CoordinatorController, CoordinatorAccessController],
  providers: [
    CoordinatorService,
    CoordinatorRepository,
    CoordinatorAccessGuard,
  ],
  exports: [CoordinatorService, CoordinatorAccessGuard],
})
export class CoordinatorModule {}
