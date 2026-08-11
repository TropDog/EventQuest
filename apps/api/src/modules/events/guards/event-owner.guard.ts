import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventsRepository } from '../events.repository';
import type { OrganizerJwtPayload } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: OrganizerJwtPayload;
      params: { eventId: string };
    }>();

    const eventId = request.params.eventId;
    if (!eventId) {
      throw new NotFoundException('Event not found');
    }

    const event = await this.eventsRepository.findOrganizerEvent(
      request.user.sub,
      eventId,
    );
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return true;
  }
}
