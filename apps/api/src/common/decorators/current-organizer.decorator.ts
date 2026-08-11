import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrganizerJwtPayload } from '../../modules/auth/strategies/jwt.strategy';

export const CurrentOrganizer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrganizerJwtPayload => {
    const request = context.switchToHttp().getRequest<{ user: OrganizerJwtPayload }>();
    return request.user;
  },
);
