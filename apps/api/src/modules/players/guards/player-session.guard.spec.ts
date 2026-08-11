import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PlayerSessionGuard } from './player-session.guard';
import { PlayersService } from '../players.service';

describe('PlayerSessionGuard', () => {
  let guard: PlayerSessionGuard;
  let playersService: jest.Mocked<PlayersService>;

  beforeEach(() => {
    playersService = {
      validateGuestSession: jest.fn(),
    } as unknown as jest.Mocked<PlayersService>;

    guard = new PlayerSessionGuard(playersService);
  });

  function createContext(authHeader?: string) {
    const request: {
      headers: { authorization?: string };
      player?: unknown;
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

  it('attaches player context for a valid bearer token', async () => {
    const payload = {
      playerId: 'player-1',
      eventId: 'event-1',
      type: 'player' as const,
    };
    playersService.validateGuestSession.mockResolvedValue(payload);

    const context = createContext('Bearer guest-token');
    const request = context.switchToHttp().getRequest();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.player).toEqual(payload);
  });

  it('rejects requests without authorization header', async () => {
    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
