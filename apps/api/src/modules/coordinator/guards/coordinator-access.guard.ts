import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CoordinatorAccessPayload } from '../coordinator.types';
import { CoordinatorService } from '../coordinator.service';

@Injectable()
export class CoordinatorAccessGuard implements CanActivate {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      coordinator?: CoordinatorAccessPayload;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Invalid or expired coordinator access token',
      );
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException(
        'Invalid or expired coordinator access token',
      );
    }

    request.coordinator =
      await this.coordinatorService.validateCoordinatorToken(token);

    return true;
  }
}
