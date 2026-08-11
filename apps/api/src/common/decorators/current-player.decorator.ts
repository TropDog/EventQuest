import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlayerSessionPayload } from '../../modules/players/player.types';

export const CurrentPlayer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PlayerSessionPayload => {
    const request = context.switchToHttp().getRequest<{
      player: PlayerSessionPayload;
    }>();
    return request.player;
  },
);
