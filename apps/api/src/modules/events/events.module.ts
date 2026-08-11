import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PackagesModule } from '../packages/packages.module';
import { CoordinatorModule } from '../coordinator/coordinator.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { EventOwnerGuard } from './guards/event-owner.guard';
import { EventOrganizerOrCoordinatorGuard } from './guards/event-organizer-or-coordinator.guard';

@Module({
  imports: [AuthModule, PackagesModule, forwardRef(() => CoordinatorModule)],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventsRepository,
    EventOwnerGuard,
    EventOrganizerOrCoordinatorGuard,
  ],
  exports: [EventsService, EventsRepository, EventOwnerGuard],
})
export class EventsModule {}
