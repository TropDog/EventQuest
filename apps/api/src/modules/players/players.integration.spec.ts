import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EventStatus, GameMode } from '@prisma/client';
import { AppModule } from '../../app.module';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../../common/utils/token-hash';

describe('PlayersController (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
  }, 30_000);

  afterEach(async () => {
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    await prisma.coordinatorAccess.deleteMany();
    await prisma.event.deleteMany();
    await prisma.packagePurchase.deleteMany();
    await prisma.organizerRefreshToken.deleteMany();
    await prisma.organizerAccount.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createJoinableEvent(options?: {
    roomCode?: string;
    participantLimit?: number | null;
    status?: EventStatus;
    gameMode?: GameMode;
  }) {
    const organizer = await prisma.organizerAccount.create({
      data: {
        email: `organizer-${Date.now()}@example.com`,
        passwordHash: 'hash',
        termsAcceptedAt: new Date(),
      },
    });

    const purchase = await prisma.packagePurchase.create({
      data: {
        organizerId: organizer.id,
        packageType: 'STANDARD',
        paymentStatus: 'PAID',
        participantLimit: options?.participantLimit ?? 100,
      },
    });

    const event = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        packagePurchaseId: purchase.id,
        name: 'Test Event',
        eventType: 'wedding',
        roomCode: options?.roomCode ?? `ROOM-${Date.now()}`,
        status: options?.status ?? EventStatus.ACTIVE,
        gameMode: options?.gameMode ?? GameMode.SOLO,
        participantLimit: options?.participantLimit ?? 100,
      },
    });

    return event;
  }

  it('resolves a joinable room code and joins a player with a hashed guest token', async () => {
    const event = await createJoinableEvent({ roomCode: 'JOIN-ROOM-1' });

    const joinContext = await request(app.getHttpServer())
      .get('/join/JOIN-ROOM-1')
      .expect(200);

    expect(joinContext.body.event.id).toBe(event.id);
    expect(joinContext.body.event.playerCount).toBe(0);

    const joinResponse = await request(app.getHttpServer())
      .post(`/events/${event.id}/players`)
      .send({
        nickname: 'PlayerOne',
        termsAccepted: true,
      })
      .expect(201);

    expect(joinResponse.body.guestToken).toBeDefined();
    expect(joinResponse.body.player.nickname).toBe('PlayerOne');
    expect(joinResponse.body.player.guestTokenHash).toBeUndefined();

    const stored = await prisma.player.findUnique({
      where: { id: joinResponse.body.player.id },
    });
    expect(stored?.guestTokenHash).toBe(
      hashToken(joinResponse.body.guestToken),
    );
    expect(stored?.guestTokenHash).not.toBe(joinResponse.body.guestToken);

    const meResponse = await request(app.getHttpServer())
      .get('/players/me')
      .set('Authorization', `Bearer ${joinResponse.body.guestToken}`)
      .expect(200);

    expect(meResponse.body.nickname).toBe('PlayerOne');
    expect(meResponse.body.guestTokenHash).toBeUndefined();
  });

  it('rejects invalid or non-existent room codes', async () => {
    await request(app.getHttpServer()).get('/join/UNKNOWN-ROOM').expect(404);
  });

  it('rejects invalid join input and closed events', async () => {
    const closedEvent = await createJoinableEvent({
      roomCode: 'CLOSED-ROOM',
      status: EventStatus.CLOSED,
    });

    await request(app.getHttpServer()).get('/join/CLOSED-ROOM').expect(409);

    await request(app.getHttpServer())
      .post(`/events/${closedEvent.id}/players`)
      .send({
        nickname: 'PlayerOne',
        termsAccepted: true,
      })
      .expect(409);

    const activeEvent = await createJoinableEvent();
    await request(app.getHttpServer())
      .post(`/events/${activeEvent.id}/players`)
      .send({
        nickname: '',
        termsAccepted: true,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/events/${activeEvent.id}/players`)
      .send({
        nickname: 'PlayerOne',
        termsAccepted: false,
      })
      .expect(400);
  });

  it('rejects invalid guest session tokens', async () => {
    await request(app.getHttpServer()).get('/players/me').expect(401);

    await request(app.getHttpServer())
      .get('/players/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('treats a nickname change as a new player on rejoin', async () => {
    const event = await createJoinableEvent();

    const firstJoin = await request(app.getHttpServer())
      .post(`/events/${event.id}/players`)
      .send({
        nickname: 'FirstNick',
        termsAccepted: true,
      })
      .expect(201);

    const secondJoin = await request(app.getHttpServer())
      .post(`/events/${event.id}/players`)
      .send({
        nickname: 'SecondNick',
        termsAccepted: true,
      })
      .expect(201);

    expect(secondJoin.body.player.id).not.toBe(firstJoin.body.player.id);
    expect(secondJoin.body.guestToken).not.toBe(firstJoin.body.guestToken);

    await request(app.getHttpServer())
      .get('/players/me')
      .set('Authorization', `Bearer ${firstJoin.body.guestToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/players/me')
      .set('Authorization', `Bearer ${secondJoin.body.guestToken}`)
      .expect(200);
  });

  it('enforces participant limits during join resolution and creation', async () => {
    const event = await createJoinableEvent({ participantLimit: 1 });

    await request(app.getHttpServer())
      .post(`/events/${event.id}/players`)
      .send({
        nickname: 'PlayerOne',
        termsAccepted: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/join/${event.roomCode}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/events/${event.id}/players`)
      .send({
        nickname: 'PlayerTwo',
        termsAccepted: true,
      })
      .expect(409);
  });

  it('does not exceed participant limit under concurrent join requests', async () => {
    const event = await createJoinableEvent({ participantLimit: 2 });

    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        request(app.getHttpServer())
          .post(`/events/${event.id}/players`)
          .send({
            nickname: `ConcurrentPlayer${index}`,
            termsAccepted: true,
          }),
      ),
    );

    const successCount = responses.filter((response) => response.status === 201)
      .length;
    const conflictCount = responses.filter((response) => response.status === 409)
      .length;

    expect(successCount).toBe(2);
    expect(conflictCount).toBe(4);

    const storedCount = await prisma.player.count({
      where: { eventId: event.id },
    });
    expect(storedCount).toBe(2);

    for (const response of responses.filter(
      (candidate) => candidate.status === 201,
    )) {
      const stored = await prisma.player.findUnique({
        where: { id: response.body.player.id },
      });
      expect(stored?.guestTokenHash).toBe(
        hashToken(response.body.guestToken),
      );
      expect(stored?.guestTokenHash).not.toBe(response.body.guestToken);
    }
  });

  it('allows players to join team mode events before selecting a team', async () => {
    const event = await createJoinableEvent({ gameMode: GameMode.TEAMS });

    const joinResponse = await request(app.getHttpServer())
      .post(`/events/${event.id}/players`)
      .send({
        nickname: 'TeamModePlayer',
        termsAccepted: true,
      })
      .expect(201);

    expect(joinResponse.body.player.teamId).toBeNull();
  });
});
