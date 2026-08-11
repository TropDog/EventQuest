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
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventOwnerGuard } from './guards/event-owner.guard';
import { EventOrganizerOrCoordinatorGuard } from './guards/event-organizer-or-coordinator.guard';
import { CurrentOrganizer } from '../../common/decorators/current-organizer.decorator';
import type { OrganizerJwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createEvent(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.createEvent(organizer.sub, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listEvents(@CurrentOrganizer() organizer: OrganizerJwtPayload) {
    return this.eventsService.listOrganizerEvents(organizer.sub);
  }

  @Get(':eventId')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  getEvent(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.eventsService.getOrganizerEvent(organizer.sub, eventId);
  }

  @Patch(':eventId')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  updateEvent(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(organizer.sub, eventId, dto);
  }

  @Post(':eventId/open')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  openEvent(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.eventsService.openEvent(organizer.sub, eventId);
  }

  @Post(':eventId/close')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  closeEvent(
    @CurrentOrganizer() organizer: OrganizerJwtPayload,
    @Param('eventId') eventId: string,
  ) {
    return this.eventsService.closeEvent(organizer.sub, eventId);
  }

  @Get(':eventId/qr')
  @UseGuards(EventOrganizerOrCoordinatorGuard)
  getEventQr(@Param('eventId') eventId: string) {
    return this.eventsService.getEventQr(eventId);
  }
}
