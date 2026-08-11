import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CoordinatorService } from '../../coordinator/coordinator.service';
import { EventsRepository } from '../events.repository';
import type { OrganizerJwtPayload } from '../../auth/strategies/jwt.strategy';
import type { CoordinatorAccessPayload } from '../../coordinator/coordinator.types';

type EventAccessRequest = {
  headers: { authorization?: string };
  params: { eventId: string };
  user?: OrganizerJwtPayload;
  coordinator?: CoordinatorAccessPayload;
};

@Injectable()
export class EventOrganizerOrCoordinatorGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly coordinatorService: CoordinatorService,
    private readonly eventsRepository: EventsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<EventAccessRequest>();
    const eventId = request.params.eventId;

    if (!eventId) {
      throw new NotFoundException('Event not found');
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const organizer = await this.tryResolveOrganizer(token);
    if (organizer) {
      const event = await this.eventsRepository.findOrganizerEvent(
        organizer.sub,
        eventId,
      );
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      request.user = organizer;
      return true;
    }

    const coordinator = await this.tryResolveCoordinator(token);
    if (coordinator) {
      if (coordinator.eventId !== eventId) {
        throw new NotFoundException('Event not found');
      }

      request.coordinator = coordinator;
      return true;
    }

    throw new UnauthorizedException('Authentication required');
  }

  private async tryResolveOrganizer(
    token: string,
  ): Promise<OrganizerJwtPayload | null> {
    try {
      const secret = this.configService.get<string>('jwt.accessSecret');
      if (!secret) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync<OrganizerJwtPayload>(
        token,
        { secret },
      );

      if (payload.type !== 'access') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private async tryResolveCoordinator(
    token: string,
  ): Promise<CoordinatorAccessPayload | null> {
    try {
      return await this.coordinatorService.validateCoordinatorToken(token);
    } catch {
      return null;
    }
  }
}
