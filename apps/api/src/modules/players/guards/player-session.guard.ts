import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PlayerSessionPayload } from '../player.types';
import { PlayersService } from '../players.service';

@Injectable()
export class PlayerSessionGuard implements CanActivate {
  constructor(private readonly playersService: PlayersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      player?: PlayerSessionPayload;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid guest session token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Invalid guest session token');
    }

    request.player = await this.playersService.validateGuestSession(token);

    return true;
  }
}
