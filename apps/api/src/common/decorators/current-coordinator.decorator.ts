import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CoordinatorAccessPayload } from '../../modules/coordinator/coordinator.types';

export const CurrentCoordinator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CoordinatorAccessPayload => {
    const request = context.switchToHttp().getRequest<{
      coordinator: CoordinatorAccessPayload;
    }>();
    return request.coordinator;
  },
);
