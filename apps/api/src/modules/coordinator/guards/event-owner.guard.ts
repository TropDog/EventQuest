import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoordinatorRepository } from '../coordinator.repository';
import type { OrganizerJwtPayload } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class EventOwnerGuard implements CanActivate {
  constructor(private readonly coordinatorRepository: CoordinatorRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: OrganizerJwtPayload;
      params: { eventId: string };
    }>();

    const eventId = request.params.eventId;
    if (!eventId) {
      throw new NotFoundException('Event not found');
    }

    const event = await this.coordinatorRepository.findEventById(eventId);
    if (!event || event.organizerId !== request.user.sub) {
      throw new NotFoundException('Event not found');
    }

    return true;
  }
}
