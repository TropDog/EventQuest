import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventOwnerGuard } from '../events/guards/event-owner.guard';
import { CurrentOrganizer } from '../../common/decorators/current-organizer.decorator';
import type { OrganizerJwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Get(':token')
  @HttpCode(HttpStatus.OK)
  resolveAccess(@Param('token') token: string) {
    return this.coordinatorService.resolveCoordinatorAccess(token);
  }
}

@Controller('events/:eventId/coordinator-access')
export class CoordinatorAccessController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post()
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  createAccess(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.coordinatorService.createCoordinatorAccess(
      organizer.sub,
      eventId,
    );
  }

  @Delete(':accessId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  revokeAccess(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Param('eventId') eventId: string,
    @Param('accessId') accessId: string,
  ) {
    return this.coordinatorService.revokeCoordinatorAccess(
      organizer.sub,
      eventId,
      accessId,
    );
  }
}
