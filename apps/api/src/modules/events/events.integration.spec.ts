import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { EventStatus, GameMode, PaymentStatus } from '@eventquest/shared';
import { AppModule } from '../../app.module';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsService } from './events.service';
import * as roomCodeUtils from './utils/room-code';

describe('Events (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventsService: EventsService;
  const webhookSecret = 'test-payments-webhook-secret';

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
    process.env.NODE_ENV = 'development';
    process.env.PAYMENTS_PROVIDER = 'placeholder';
    process.env.PAYMENTS_WEBHOOK_SECRET = webhookSecret;
    process.env.FRONTEND_BASE_URL = 'http://localhost:3000';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ rawBody: true });
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
    eventsService = app.get(EventsService);
  }, 30_000);

  afterEach(async () => {
    jest.restoreAllMocks();
    await prisma.player.deleteMany();
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

  function signWebhookPayload(payload: Record<string, unknown>) {
    const body = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return { body, signature };
  }

  async function createPaidPurchase(accessToken: string, packageType = 'FREE') {
    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packageType })
      .expect(201);

    const webhookPayload = {
      type: 'checkout.session.completed',
      sessionId: checkoutResponse.body.checkoutSessionId,
      packagePurchaseId: checkoutResponse.body.packagePurchaseId,
    };
    const { body, signature } = signWebhookPayload(webhookPayload);

    await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-payment-webhook-signature', signature)
      .send(body)
      .expect(200);

    return checkoutResponse.body.packagePurchaseId as string;
  }

  async function createDraftEvent(accessToken: string) {
    const purchaseId = await createPaidPurchase(accessToken);

    const createResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        packagePurchaseId: purchaseId,
        name: 'Draft Event',
        eventType: 'wedding',
        gameMode: GameMode.SOLO,
      })
      .expect(201);

    return {
      eventId: createResponse.body.event.id as string,
      purchaseId,
      roomCode: createResponse.body.event.roomCode as string,
    };
  }

  async function createConfiguredEvent(accessToken: string) {
    const purchaseId = await createPaidPurchase(accessToken);

    const createResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        packagePurchaseId: purchaseId,
        name: 'Integration Event',
        eventType: 'wedding',
        gameMode: GameMode.SOLO,
      })
      .expect(201);

    const eventId = createResponse.body.event.id as string;

    await request(app.getHttpServer())
      .patch(`/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: EventStatus.CONFIGURED })
      .expect(200);

    return {
      eventId,
      purchaseId,
      roomCode: createResponse.body.event.roomCode as string,
    };
  }

  it('creates an event from a paid package, consumes the package, and generates a unique room code', async () => {
    const organizer = await registerOrganizer('events-create@example.com');
    const purchaseId = await createPaidPurchase(organizer.accessToken);

    const response = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        packagePurchaseId: purchaseId,
        name: 'Wedding Quest',
        eventType: 'wedding',
      })
      .expect(201);

    expect(response.body.event.status).toBe(EventStatus.DRAFT);
    expect(response.body.event.participantLimit).toBe(20);
    expect(response.body.event.roomCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(response.body.event.organizerId).toBe(organizer.organizer.id);

    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
    });
    expect(purchase?.paymentStatus).toBe(PaymentStatus.USED);
    expect(purchase?.usedAt).not.toBeNull();
  });

  it('rejects creating an event from an unpaid or already used package', async () => {
    const organizer = await registerOrganizer('events-invalid-pkg@example.com');

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({ packageType: 'FREE' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        packagePurchaseId: checkoutResponse.body.packagePurchaseId,
        name: 'Pending Event',
        eventType: 'party',
      })
      .expect(400);

    const paidPurchaseId = await createPaidPurchase(organizer.accessToken);

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        packagePurchaseId: paidPurchaseId,
        name: 'First Event',
        eventType: 'party',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        packagePurchaseId: paidPurchaseId,
        name: 'Second Event',
        eventType: 'party',
      })
      .expect(400);
  });

  it('lists and reads only organizer-owned events', async () => {
    const owner = await registerOrganizer('events-owner@example.com');
    const other = await registerOrganizer('events-other@example.com');
    const { eventId } = await createConfiguredEvent(owner.accessToken);

    const listResponse = await request(app.getHttpServer())
      .get('/events')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(listResponse.body.events).toHaveLength(1);
    expect(listResponse.body.events[0].id).toBe(eventId);

    await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(404);
  });

  it('supports configuration, opening, closing, and QR access for organizer and coordinator', async () => {
    const organizer = await registerOrganizer('events-lifecycle@example.com');
    const { eventId, roomCode } = await createConfiguredEvent(
      organizer.accessToken,
    );

    const openResponse = await request(app.getHttpServer())
      .post(`/events/${eventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    expect(openResponse.body.event.status).toBe(EventStatus.ACTIVE);
    expect(openResponse.body.event.startsAt).toBeTruthy();
    expect(openResponse.body.event.closesAt).toBeTruthy();

    const qrResponse = await request(app.getHttpServer())
      .get(`/events/${eventId}/qr`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    expect(qrResponse.body.roomCode).toBe(roomCode);
    expect(qrResponse.body.joinUrl).toBe(
      `http://localhost:3000/join/${roomCode}`,
    );
    expect(qrResponse.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);

    const coordinatorAccess = await request(app.getHttpServer())
      .post(`/events/${eventId}/coordinator-access`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/events/${eventId}/qr`)
      .set(
        'Authorization',
        `Bearer ${coordinatorAccess.body.token as string}`,
      )
      .expect(200);

    const closeResponse = await request(app.getHttpServer())
      .post(`/events/${eventId}/close`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    expect(closeResponse.body.event.status).toBe(EventStatus.CLOSED);
    expect(closeResponse.body.event.closedAt).toBeTruthy();
  });

  it('rejects invalid lifecycle transitions and post-activation configuration', async () => {
    const organizer = await registerOrganizer('events-transitions@example.com');
    const { eventId } = await createConfiguredEvent(organizer.accessToken);

    await request(app.getHttpServer())
      .post(`/events/${eventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/events/${eventId}`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({ name: 'Too Late' })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/events/${eventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(409);
  });

  it('allows player join only after the event is opened', async () => {
    const organizer = await registerOrganizer('events-joinable@example.com');
    const { eventId, roomCode } = await createConfiguredEvent(
      organizer.accessToken,
    );

    await request(app.getHttpServer())
      .get(`/join/${roomCode}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/events/${eventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/join/${roomCode}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/events/${eventId}/players`)
      .send({
        nickname: 'Guest One',
        termsAccepted: true,
      })
      .expect(201);
  });

  it('closes expired active events through the service batch operation', async () => {
    const organizer = await registerOrganizer('events-auto-close@example.com');
    const { eventId } = await createConfiguredEvent(organizer.accessToken);

    await request(app.getHttpServer())
      .post(`/events/${eventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    await prisma.event.update({
      where: { id: eventId },
      data: {
        closesAt: new Date(Date.now() - 60_000),
      },
    });

    await expect(eventsService.closeExpiredEvents()).resolves.toBe(1);

    const closedEvent = await prisma.event.findUnique({ where: { id: eventId } });
    expect(closedEvent?.status).toBe(EventStatus.CLOSED);
    expect(closedEvent?.closedAt).not.toBeNull();
  });

  it('allows only one concurrent event creation per package purchase', async () => {
    const organizer = await registerOrganizer('events-concurrency@example.com');
    const purchaseId = await createPaidPurchase(organizer.accessToken);

    const payload = {
      packagePurchaseId: purchaseId,
      name: 'Race Event',
      eventType: 'party',
    };

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizer.accessToken}`)
        .send(payload),
      request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${organizer.accessToken}`)
        .send(payload),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 400]);

    const successResponse = first.status === 201 ? first : second;
    const failureResponse = first.status === 400 ? first : second;

    expect(successResponse.body.event.packagePurchaseId).toBe(purchaseId);
    expect(successResponse.body.event.id).toBeDefined();

    const eventsForPurchase = await prisma.event.findMany({
      where: { packagePurchaseId: purchaseId },
    });
    expect(eventsForPurchase).toHaveLength(1);
    expect(eventsForPurchase[0]?.id).toBe(successResponse.body.event.id);
    expect(eventsForPurchase[0]?.packagePurchaseId).toBe(purchaseId);

    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
    });
    expect(purchase?.paymentStatus).toBe(PaymentStatus.USED);
    expect(purchase?.usedAt).not.toBeNull();

    const organizerEvents = await prisma.event.findMany({
      where: { organizerId: organizer.organizer.id },
    });
    expect(organizerEvents).toHaveLength(1);

    expect(failureResponse.body.message).toBeDefined();
  });

  it('retries event creation when a generated room code collides at insert time', async () => {
    const organizer = await registerOrganizer('events-room-collision@example.com');
    const blockingOrganizer = await registerOrganizer(
      'events-room-collision-blocker@example.com',
    );
    const blockingPurchaseId = await createPaidPurchase(
      blockingOrganizer.accessToken,
    );

    const blockingEvent = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${blockingOrganizer.accessToken}`)
      .send({
        packagePurchaseId: blockingPurchaseId,
        name: 'Blocking Event',
        eventType: 'party',
      })
      .expect(201);

    await prisma.event.update({
      where: { id: blockingEvent.body.event.id as string },
      data: { roomCode: 'COLLIDE' },
    });

    const purchaseId = await createPaidPurchase(organizer.accessToken);

    jest
      .spyOn(roomCodeUtils, 'generateRoomCode')
      .mockReturnValueOnce('COLLIDE')
      .mockReturnValueOnce('RETRY1');

    const response = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .send({
        packagePurchaseId: purchaseId,
        name: 'Retried Event',
        eventType: 'party',
      })
      .expect(201);

    expect(response.body.event.roomCode).toBe('RETRY1');

    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
    });
    expect(purchase?.paymentStatus).toBe(PaymentStatus.USED);

    const eventsForPurchase = await prisma.event.findMany({
      where: { packagePurchaseId: purchaseId },
    });
    expect(eventsForPurchase).toHaveLength(1);
    expect(eventsForPurchase[0]?.roomCode).toBe('RETRY1');
  });

  it('rejects coordinator access to another event QR endpoint', async () => {
    const organizer = await registerOrganizer('events-coord-qr@example.com');
    const { eventId: eventAId } = await createConfiguredEvent(
      organizer.accessToken,
    );
    const { eventId: eventBId } = await createConfiguredEvent(
      organizer.accessToken,
    );

    const coordinatorAccess = await request(app.getHttpServer())
      .post(`/events/${eventAId}/coordinator-access`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/events/${eventBId}/qr`)
      .set(
        'Authorization',
        `Bearer ${coordinatorAccess.body.token as string}`,
      )
      .expect(404);
  });

  it('rejects cross-organizer event creation using another organizers package', async () => {
    const organizerA = await registerOrganizer('events-pkg-owner@example.com');
    const organizerB = await registerOrganizer('events-pkg-attacker@example.com');
    const purchaseId = await createPaidPurchase(organizerA.accessToken);

    await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizerB.accessToken}`)
      .send({
        packagePurchaseId: purchaseId,
        name: 'Stolen Event',
        eventType: 'party',
      })
      .expect(404);

    const purchase = await prisma.packagePurchase.findUnique({
      where: { id: purchaseId },
    });
    expect(purchase?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(purchase?.usedAt).toBeNull();

    const eventsForPurchase = await prisma.event.findMany({
      where: { packagePurchaseId: purchaseId },
    });
    expect(eventsForPurchase).toHaveLength(0);

    const organizerBEvents = await prisma.event.findMany({
      where: { organizerId: organizerB.organizer.id },
    });
    expect(organizerBEvents).toHaveLength(0);
  });

  it('rejects important invalid lifecycle transitions over HTTP', async () => {
    const organizer = await registerOrganizer('events-invalid-transitions@example.com');
    const { eventId: draftEventId } = await createDraftEvent(
      organizer.accessToken,
    );
    const { eventId: configuredEventId } = await createConfiguredEvent(
      organizer.accessToken,
    );

    await request(app.getHttpServer())
      .post(`/events/${draftEventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/events/${configuredEventId}/close`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/events/${configuredEventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/events/${configuredEventId}/close`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/events/${configuredEventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/events/${configuredEventId}/close`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(409);

    const { eventId: archivedEventId } = await createDraftEvent(
      organizer.accessToken,
    );
    await prisma.event.update({
      where: { id: archivedEventId },
      data: { status: EventStatus.ARCHIVED },
    });

    await request(app.getHttpServer())
      .post(`/events/${archivedEventId}/open`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/events/${archivedEventId}/close`)
      .set('Authorization', `Bearer ${organizer.accessToken}`)
      .expect(409);
  });
});
