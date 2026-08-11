import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EventStatus, GameMode } from '@prisma/client';
import { AppModule } from '../../app.module';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../../common/utils/token-hash';

describe('TeamsController (integration)', () => {
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

  async function registerOrganizer(email: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    return response.body as {
      accessToken: string;
      organizer: { id: string };
    };
  }

  async function createTeamEvent(options?: {
    organizerId?: string;
    status?: EventStatus;
    participantLimit?: number;
  }) {
    const organizer =
      options?.organizerId ??
      (
        await prisma.organizerAccount.create({
          data: {
            email: `organizer-${Date.now()}@example.com`,
            passwordHash: 'hash',
            termsAcceptedAt: new Date(),
          },
        })
      ).id;

    const purchase = await prisma.packagePurchase.create({
      data: {
        organizerId: organizer,
        packageType: 'STANDARD',
        paymentStatus: 'PAID',
        participantLimit: options?.participantLimit ?? 100,
      },
    });

    return prisma.event.create({
      data: {
        organizerId: organizer,
        packagePurchaseId: purchase.id,
        name: 'Team Event',
        eventType: 'wedding',
        roomCode: `TEAM-${Date.now()}`,
        status: options?.status ?? EventStatus.ACTIVE,
        gameMode: GameMode.TEAMS,
        participantLimit: options?.participantLimit ?? 100,
      },
    });
  }

  async function joinPlayer(eventId: string, nickname: string) {
    return request(app.getHttpServer())
      .post(`/events/${eventId}/players`)
      .send({
        nickname,
        termsAccepted: true,
      })
      .expect(201);
  }

  it('lets an organizer configure teams and exposes them publicly for joinable events', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `organizer-${Date.now()}@example.com`,
    );
    const event = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    const configureResponse = await request(app.getHttpServer())
      .put(`/events/${event.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        teamCount: 2,
        maxPlayersPerTeam: 3,
      })
      .expect(200);

    expect(configureResponse.body.teams).toHaveLength(2);
    expect(configureResponse.body.teams[0].name).toBe('Team 1');
    expect(configureResponse.body.teams[0].availableSpots).toBe(3);

    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.ACTIVE },
    });

    const publicList = await request(app.getHttpServer())
      .get(`/events/${event.id}/teams`)
      .expect(200);

    expect(publicList.body.teams).toHaveLength(2);
    expect(publicList.body.teams[0].isFull).toBe(false);
  });

  it('supports the team mode player onboarding flow', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `organizer-${Date.now()}@example.com`,
    );
    const event = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    const configured = await request(app.getHttpServer())
      .put(`/events/${event.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        teamCount: 1,
        maxPlayersPerTeam: 2,
      })
      .expect(200);

    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.ACTIVE },
    });

    const joinResponse = await joinPlayer(event.id, 'TeamPlayer');
    const teamId = configured.body.teams[0].id;

    const teamJoinResponse = await request(app.getHttpServer())
      .post(`/events/${event.id}/teams/${teamId}/join`)
      .set('Authorization', `Bearer ${joinResponse.body.guestToken}`)
      .expect(201);

    expect(teamJoinResponse.body.player.teamId).toBe(teamId);

    const meResponse = await request(app.getHttpServer())
      .get('/players/me')
      .set('Authorization', `Bearer ${joinResponse.body.guestToken}`)
      .expect(200);

    expect(meResponse.body.teamId).toBe(teamId);
  });

  it('rejects joining a full team and enforces capacity under concurrency', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `organizer-${Date.now()}@example.com`,
    );
    const event = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    const configured = await request(app.getHttpServer())
      .put(`/events/${event.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        teamCount: 1,
        maxPlayersPerTeam: 2,
      })
      .expect(200);

    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.ACTIVE },
    });

    const teamId = configured.body.teams[0].id;
    const tokens = await Promise.all([
      joinPlayer(event.id, 'PlayerA'),
      joinPlayer(event.id, 'PlayerB'),
      joinPlayer(event.id, 'PlayerC'),
    ]);

    const responses = await Promise.all(
      tokens.map((response) =>
        request(app.getHttpServer())
          .post(`/events/${event.id}/teams/${teamId}/join`)
          .set('Authorization', `Bearer ${response.body.guestToken}`),
      ),
    );

    const successCount = responses.filter((response) => response.status === 201)
      .length;
    const conflictCount = responses.filter((response) => response.status === 409)
      .length;

    expect(successCount).toBe(2);
    expect(conflictCount).toBe(1);

    const assignedCount = await prisma.player.count({
      where: { teamId },
    });
    expect(assignedCount).toBe(2);
  });

  it('allows a team member to rename a team once and rejects further changes', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `organizer-${Date.now()}@example.com`,
    );
    const event = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    const configured = await request(app.getHttpServer())
      .put(`/events/${event.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        teamCount: 1,
        maxPlayersPerTeam: 4,
      })
      .expect(200);

    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.ACTIVE },
    });

    const teamId = configured.body.teams[0].id;
    const joinResponse = await joinPlayer(event.id, 'Renamer');

    await request(app.getHttpServer())
      .post(`/events/${event.id}/teams/${teamId}/join`)
      .set('Authorization', `Bearer ${joinResponse.body.guestToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/events/${event.id}/teams/${teamId}/name`)
      .set('Authorization', `Bearer ${joinResponse.body.guestToken}`)
      .send({ name: 'Dream Team' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/events/${event.id}/teams/${teamId}/name`)
      .set('Authorization', `Bearer ${joinResponse.body.guestToken}`)
      .send({ name: 'Another Name' })
      .expect(409);
  });

  it('prevents cross-event team access and non-member renames', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `owner-${Date.now()}@example.com`,
    );
    const eventA = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });
    const eventB = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    const teamsA = await request(app.getHttpServer())
      .put(`/events/${eventA.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ teamCount: 1, maxPlayersPerTeam: 2 })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/events/${eventB.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ teamCount: 1, maxPlayersPerTeam: 2 })
      .expect(200);

    await prisma.event.updateMany({
      where: { id: { in: [eventA.id, eventB.id] } },
      data: { status: EventStatus.ACTIVE },
    });

    const playerA = await joinPlayer(eventA.id, 'PlayerA');
    const playerB = await joinPlayer(eventB.id, 'PlayerB');
    const teamAId = teamsA.body.teams[0].id;

    await request(app.getHttpServer())
      .post(`/events/${eventA.id}/teams/${teamAId}/join`)
      .set('Authorization', `Bearer ${playerA.body.guestToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/events/${eventB.id}/teams/${teamAId}/join`)
      .set('Authorization', `Bearer ${playerB.body.guestToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/events/${eventA.id}/teams/${teamAId}/name`)
      .set('Authorization', `Bearer ${playerB.body.guestToken}`)
      .send({ name: 'Intruder Team' })
      .expect(404);
  });

  it('rejects team configuration for solo mode events and non-owners', async () => {
    const owner = await registerOrganizer(`owner-${Date.now()}@example.com`);
    const other = await registerOrganizer(`other-${Date.now()}@example.com`);

    const soloEvent = await prisma.event.create({
      data: {
        organizerId: owner.organizer.id,
        packagePurchaseId: (
          await prisma.packagePurchase.create({
            data: {
              organizerId: owner.organizer.id,
              packageType: 'STANDARD',
              paymentStatus: 'PAID',
              participantLimit: 100,
            },
          })
        ).id,
        name: 'Solo Event',
        eventType: 'wedding',
        roomCode: `SOLO-${Date.now()}`,
        status: EventStatus.CONFIGURED,
        gameMode: GameMode.SOLO,
        participantLimit: 100,
      },
    });

    await request(app.getHttpServer())
      .put(`/events/${soloEvent.id}/teams`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ teamCount: 2, maxPlayersPerTeam: 4 })
      .expect(400);

    const teamEvent = await createTeamEvent({
      organizerId: owner.organizer.id,
      status: EventStatus.CONFIGURED,
    });

    await request(app.getHttpServer())
      .put(`/events/${teamEvent.id}/teams`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .send({ teamCount: 2, maxPlayersPerTeam: 4 })
      .expect(404);
  });

  it('does not expose guest token hashes through team join responses', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `organizer-${Date.now()}@example.com`,
    );
    const event = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    const configured = await request(app.getHttpServer())
      .put(`/events/${event.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ teamCount: 1, maxPlayersPerTeam: 2 })
      .expect(200);

    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.ACTIVE },
    });

    const joinResponse = await joinPlayer(event.id, 'SecurePlayer');
    const teamId = configured.body.teams[0].id;

    const teamJoinResponse = await request(app.getHttpServer())
      .post(`/events/${event.id}/teams/${teamId}/join`)
      .set('Authorization', `Bearer ${joinResponse.body.guestToken}`)
      .expect(201);

    expect(teamJoinResponse.body.player.guestTokenHash).toBeUndefined();

    const stored = await prisma.player.findUnique({
      where: { id: joinResponse.body.player.id },
    });
    expect(stored?.guestTokenHash).toBe(
      hashToken(joinResponse.body.guestToken),
    );
  });

  it('rejects team join for solo mode events', async () => {
    const owner = await registerOrganizer(`solo-join-${Date.now()}@example.com`);

    const soloEvent = await prisma.event.create({
      data: {
        organizerId: owner.organizer.id,
        packagePurchaseId: (
          await prisma.packagePurchase.create({
            data: {
              organizerId: owner.organizer.id,
              packageType: 'STANDARD',
              paymentStatus: 'PAID',
              participantLimit: 100,
            },
          })
        ).id,
        name: 'Solo Event',
        eventType: 'wedding',
        roomCode: `SOLO-JOIN-${Date.now()}`,
        status: EventStatus.ACTIVE,
        gameMode: GameMode.SOLO,
        participantLimit: 100,
      },
    });

    const team = await prisma.team.create({
      data: {
        eventId: soloEvent.id,
        name: 'Team 1',
        defaultNumber: 1,
        maxPlayers: 4,
      },
    });

    const playerJoin = await joinPlayer(soloEvent.id, 'SoloPlayer');

    await request(app.getHttpServer())
      .post(`/events/${soloEvent.id}/teams/${team.id}/join`)
      .set('Authorization', `Bearer ${playerJoin.body.guestToken}`)
      .expect(409);

    const storedPlayer = await prisma.player.findUnique({
      where: { id: playerJoin.body.player.id },
    });
    expect(storedPlayer?.teamId).toBeNull();

    const teamMemberCount = await prisma.player.count({
      where: { teamId: team.id },
    });
    expect(teamMemberCount).toBe(0);
  });

  it('scopes coordinator team listing to the coordinator event', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `coordinator-teams-${Date.now()}@example.com`,
    );
    const eventA = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });
    const eventB = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    await request(app.getHttpServer())
      .put(`/events/${eventA.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ teamCount: 1, maxPlayersPerTeam: 4 })
      .expect(200);

    const eventBTeams = await request(app.getHttpServer())
      .put(`/events/${eventB.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ teamCount: 2, maxPlayersPerTeam: 3 })
      .expect(200);

    const coordinatorAccess = await request(app.getHttpServer())
      .post(`/events/${eventA.id}/coordinator-access`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const coordinatorToken = coordinatorAccess.body.token as string;

    await request(app.getHttpServer())
      .get(`/events/${eventB.id}/teams`)
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .expect(404);

    const eventAList = await request(app.getHttpServer())
      .get(`/events/${eventA.id}/teams`)
      .set('Authorization', `Bearer ${coordinatorToken}`)
      .expect(200);

    expect(eventAList.body.teams).toHaveLength(1);
    expect(
      eventAList.body.teams.some(
        (team: { id: string }) =>
          eventBTeams.body.teams.some(
            (eventBTeam: { id: string }) => eventBTeam.id === team.id,
          ),
      ),
    ).toBe(false);
  });

  it('rejects team reconfiguration after the event becomes active', async () => {
    const { accessToken, organizer } = await registerOrganizer(
      `active-reconfig-${Date.now()}@example.com`,
    );
    const event = await createTeamEvent({
      organizerId: organizer.id,
      status: EventStatus.CONFIGURED,
    });

    const initialConfig = await request(app.getHttpServer())
      .put(`/events/${event.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        teamCount: 2,
        maxPlayersPerTeam: 3,
      })
      .expect(200);

    await prisma.event.update({
      where: { id: event.id },
      data: { status: EventStatus.ACTIVE },
    });

    await request(app.getHttpServer())
      .put(`/events/${event.id}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        teamCount: 4,
        maxPlayersPerTeam: 5,
      })
      .expect(409);

    const teamsAfter = await prisma.team.findMany({
      where: { eventId: event.id },
      orderBy: { defaultNumber: 'asc' },
    });

    expect(teamsAfter).toHaveLength(2);
    expect(teamsAfter[0]?.maxPlayers).toBe(3);
    expect(teamsAfter[1]?.maxPlayers).toBe(3);
    expect(teamsAfter.map((team) => team.id)).toEqual(
      initialConfig.body.teams.map((team: { id: string }) => team.id),
    );
  });
});
