import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CoordinatorAccessGuard } from './coordinator-access.guard';
import { CoordinatorService } from '../coordinator.service';

describe('CoordinatorAccessGuard', () => {
  let guard: CoordinatorAccessGuard;
  let coordinatorService: jest.Mocked<CoordinatorService>;

  beforeEach(() => {
    coordinatorService = {
      validateCoordinatorToken: jest.fn(),
    } as unknown as jest.Mocked<CoordinatorService>;

    guard = new CoordinatorAccessGuard(coordinatorService);
  });

  function createContext(authHeader?: string) {
    const request: {
      headers: { authorization?: string };
      coordinator?: unknown;
    } = {
      headers: {},
    };

    if (authHeader !== undefined) {
      request.headers.authorization = authHeader;
    }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('attaches coordinator context for a valid bearer token', async () => {
    const payload = {
      accessId: 'access-1',
      eventId: 'event-1',
      type: 'coordinator' as const,
    };
    coordinatorService.validateCoordinatorToken.mockResolvedValue(payload);

    const context = createContext('Bearer valid-token');
    const request = context.switchToHttp().getRequest();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.coordinator).toEqual(payload);
  });

  it('rejects requests without authorization header', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects invalid bearer tokens', async () => {
    coordinatorService.validateCoordinatorToken.mockRejectedValue(
      new UnauthorizedException('Invalid or expired coordinator access token'),
    );

    await expect(
      guard.canActivate(createContext('Bearer invalid-token')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
