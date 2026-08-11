import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EventStatus, GameMode } from '@prisma/client';
import { AppModule } from '../../app.module';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../../common/utils/token-hash';

describe('CoordinatorController (integration)', () => {
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

  async function createEvent(organizerId: string) {
    const purchase = await prisma.packagePurchase.create({
      data: {
        organizerId,
        packageType: 'STANDARD',
        paymentStatus: 'PAID',
        participantLimit: 100,
      },
    });

    return prisma.event.create({
      data: {
        organizerId,
        packagePurchaseId: purchase.id,
        name: 'Test Event',
        eventType: 'wedding',
        roomCode: `ROOM-${Date.now()}`,
        status: EventStatus.DRAFT,
        gameMode: GameMode.SOLO,
      },
    });
  }

  it('creates coordinator access, stores only a hash, and resolves the token', async () => {
    const organizer = await registerOrganizer('coordinator-create@example.com');
    const event = await createEvent(organizer.organizer.id);

    const createResponse = await request(app.getHttpServer())
      .post(`/events/${event.id}/coordinator-access`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(201);

    expect(createResponse.body.token).toBeDefined();
    expect(createResponse.body.coordinatorAccess.eventId).toBe(event.id);
    expect(createResponse.body.coordinatorAccess.tokenHash).toBeUndefined();

    const stored = await prisma.coordinatorAccess.findUnique({
      where: { id: createResponse.body.coordinatorAccess.id },
    });
    expect(stored?.tokenHash).toBe(hashToken(createResponse.body.token));
    expect(stored?.tokenHash).not.toBe(createResponse.body.token);

    const resolveResponse = await request(app.getHttpServer())
      .get(`/coordinator/${createResponse.body.token}`)
      .expect(200);

    expect(resolveResponse.body.event.id).toBe(event.id);
    expect(resolveResponse.body.coordinatorAccess.tokenHash).toBeUndefined();
  });

  it('rejects invalid coordinator tokens', async () => {
    await request(app.getHttpServer())
      .get('/coordinator/not-a-valid-token')
      .expect(401);
  });

  it('rejects expired coordinator tokens', async () => {
    const organizer = await registerOrganizer('coordinator-expired@example.com');
    const event = await createEvent(organizer.organizer.id);

    const createResponse = await request(app.getHttpServer())
      .post(`/events/${event.id}/coordinator-access`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(201);

    await prisma.coordinatorAccess.update({
      where: { id: createResponse.body.coordinatorAccess.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    await request(app.getHttpServer())
      .get(`/coordinator/${createResponse.body.token}`)
      .expect(401);
  });

  it('rejects revoked coordinator tokens', async () => {
    const organizer = await registerOrganizer('coordinator-revoked@example.com');
    const event = await createEvent(organizer.organizer.id);

    const createResponse = await request(app.getHttpServer())
      .post(`/events/${event.id}/coordinator-access`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .delete(
        `/events/${event.id}/coordinator-access/${createResponse.body.coordinatorAccess.id}`,
      )
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/coordinator/${createResponse.body.token}`)
      .expect(401);
  });

  it('rejects unauthorized organizer access to coordinator-access endpoints', async () => {
    const owner = await registerOrganizer('owner@example.com');
    const other = await registerOrganizer('other@example.com');
    const event = await createEvent(owner.organizer.id);

    await request(app.getHttpServer())
      .post(`/events/${event.id}/coordinator-access`)
      .expect(401);

    await request(app.getHttpServer())
      .post(`/events/${event.id}/coordinator-access`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(404);
  });
});
