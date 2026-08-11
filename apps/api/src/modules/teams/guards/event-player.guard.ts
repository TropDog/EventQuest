import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PlayerSessionPayload } from '../../players/player.types';

type EventPlayerRequest = {
  params: { eventId: string };
  player?: PlayerSessionPayload;
};

@Injectable()
export class EventPlayerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<EventPlayerRequest>();
    const eventId = request.params.eventId;
    const player = request.player;

    if (!eventId) {
      throw new NotFoundException('Event not found');
    }

    if (!player) {
      throw new UnauthorizedException('Invalid guest session token');
    }

    if (player.eventId !== eventId) {
      throw new NotFoundException('Event not found');
    }

    return true;
  }
}
