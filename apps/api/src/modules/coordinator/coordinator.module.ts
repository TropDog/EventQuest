import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CoordinatorAccessController,
  CoordinatorController,
} from './coordinator.controller';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorRepository } from './coordinator.repository';
import { EventOwnerGuard } from './guards/event-owner.guard';
import { CoordinatorAccessGuard } from './guards/coordinator-access.guard';

@Module({
  imports: [AuthModule],
  controllers: [CoordinatorController, CoordinatorAccessController],
  providers: [
    CoordinatorService,
    CoordinatorRepository,
    EventOwnerGuard,
    CoordinatorAccessGuard,
  ],
  exports: [CoordinatorService, CoordinatorAccessGuard],
})
export class CoordinatorModule {}
