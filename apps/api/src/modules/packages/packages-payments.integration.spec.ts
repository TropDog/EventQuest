import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import request from 'supertest';
import { PaymentStatus } from '@eventquest/shared';
import { AppModule } from '../../app.module';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { PrismaService } from '../../prisma/prisma.service';
import { PackagesService } from './packages.service';
import { PackagesRepository } from './packages.repository';

describe('Packages & Payments (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const webhookSecret = 'test-payments-webhook-secret';

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
    process.env.NODE_ENV = 'development';
    process.env.PAYMENTS_PROVIDER = 'placeholder';
    process.env.PAYMENTS_WEBHOOK_SECRET = webhookSecret;

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
  }, 30_000);

  afterEach(async () => {
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

    return response.body.accessToken as string;
  }

  function signWebhookPayload(payload: Record<string, unknown>) {
    const body = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return { body, signature };
  }

  function postSignedWebhook(body: string, signature: string) {
    return request(app.getHttpServer())
      .post('/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-payment-webhook-signature', signature)
      .send(body);
  }

  it('lists PRD package tiers publicly', async () => {
    const response = await request(app.getHttpServer()).get('/packages').expect(200);

    expect(response.body.map((pkg: { type: string }) => pkg.type)).toEqual([
      'FREE',
      'BASIC',
      'PREMIUM',
      'UNLIMITED',
    ]);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'FREE', participantLimit: 20 }),
        expect.objectContaining({ type: 'PREMIUM', participantLimit: 100 }),
        expect.objectContaining({ type: 'UNLIMITED', participantLimit: null }),
      ]),
    );
  });

  it('creates checkout, confirms payment via webhook, and exposes organizer purchases', async () => {
    const accessToken = await registerOrganizer('packages@example.com');

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packageType: 'FREE' })
      .expect(201);

    expect(checkoutResponse.body.packagePurchaseId).toBeDefined();
    expect(checkoutResponse.body.checkoutSessionId).toMatch(/^placeholder_cs_/);

    const pendingPurchase = await prisma.packagePurchase.findUnique({
      where: { id: checkoutResponse.body.packagePurchaseId },
    });

    expect(pendingPurchase?.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(pendingPurchase?.participantLimit).toBe(20);

    const webhookPayload = {
      type: 'checkout.session.completed',
      sessionId: checkoutResponse.body.checkoutSessionId,
      packagePurchaseId: checkoutResponse.body.packagePurchaseId,
    };
    const { body, signature } = signWebhookPayload(webhookPayload);

    const webhookResponse = await postSignedWebhook(body, signature).expect(200);

    expect(webhookResponse.body.processed).toBe(true);
    expect(webhookResponse.body.paymentStatus).toBe(PaymentStatus.PAID);

    const purchasesResponse = await request(app.getHttpServer())
      .get('/package-purchases')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(purchasesResponse.body).toHaveLength(1);
    expect(purchasesResponse.body[0].paymentStatus).toBe(PaymentStatus.PAID);
    expect(purchasesResponse.body[0].purchasedAt).not.toBeNull();
  });

  it('rejects invalid checkout input and unauthenticated checkout', async () => {
    await request(app.getHttpServer())
      .post('/payments/checkout')
      .send({ packageType: 'UNKNOWN' })
      .expect(401);

    const accessToken = await registerOrganizer('invalid-checkout@example.com');

    await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packageType: 'UNKNOWN' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packageType: 'PREMIUM' })
      .expect(400);
  });

  it('rejects unsigned webhooks', async () => {
    await request(app.getHttpServer())
      .post('/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          type: 'checkout.session.completed',
          sessionId: 'session-1',
          packagePurchaseId: 'purchase-1',
        }),
      )
      .expect(401);
  });

  it('replays the same webhook without corrupting paid state', async () => {
    const accessToken = await registerOrganizer('idempotent@example.com');

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packageType: 'FREE' })
      .expect(201);

    const webhookPayload = {
      type: 'checkout.session.completed',
      sessionId: checkoutResponse.body.checkoutSessionId,
      packagePurchaseId: checkoutResponse.body.packagePurchaseId,
    };
    const { body, signature } = signWebhookPayload(webhookPayload);

    await postSignedWebhook(body, signature).expect(200);
    await postSignedWebhook(body, signature).expect(200);

    const purchases = await prisma.packagePurchase.findMany();
    expect(purchases).toHaveLength(1);
    expect(purchases[0].paymentStatus).toBe(PaymentStatus.PAID);
  });

  it('confirms payment when webhook arrives before session id persistence', async () => {
    const organizer = await prisma.organizerAccount.create({
      data: {
        email: 'race@example.com',
        passwordHash: 'hash',
        termsAcceptedAt: new Date(),
      },
    });

    const purchase = await prisma.packagePurchase.create({
      data: {
        organizerId: organizer.id,
        packageType: 'FREE',
        participantLimit: 20,
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: 'placeholder',
      },
    });

    const sessionId = 'placeholder_cs_race_before_persist';
    const webhookPayload = {
      type: 'checkout.session.completed',
      sessionId,
      packagePurchaseId: purchase.id,
    };
    const { body, signature } = signWebhookPayload(webhookPayload);

    const webhookResponse = await postSignedWebhook(body, signature).expect(200);

    expect(webhookResponse.body.processed).toBe(true);
    expect(webhookResponse.body.paymentStatus).toBe(PaymentStatus.PAID);

    const updated = await prisma.packagePurchase.findUnique({
      where: { id: purchase.id },
    });

    expect(updated?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(updated?.paymentProviderSessionId).toBe(sessionId);
    expect(updated?.purchasedAt).not.toBeNull();
  });

  it('does not overwrite provider session id on an already paid purchase', async () => {
    const organizer = await prisma.organizerAccount.create({
      data: {
        email: 'session-overwrite@example.com',
        passwordHash: 'hash',
        termsAcceptedAt: new Date(),
      },
    });

    const webhookSessionId = 'placeholder_cs_webhook_winner';
    const lateCheckoutSessionId = 'placeholder_cs_late_checkout';

    const purchase = await prisma.packagePurchase.create({
      data: {
        organizerId: organizer.id,
        packageType: 'FREE',
        participantLimit: 20,
        paymentStatus: PaymentStatus.PAID,
        paymentProvider: 'placeholder',
        paymentProviderSessionId: webhookSessionId,
        purchasedAt: new Date(),
      },
    });

    const packagesRepository = app.get(PackagesRepository);
    const updatedCount = await packagesRepository.updatePurchaseSessionId(
      purchase.id,
      lateCheckoutSessionId,
    );

    expect(updatedCount).toBe(0);

    const unchanged = await prisma.packagePurchase.findUnique({
      where: { id: purchase.id },
    });

    expect(unchanged?.paymentStatus).toBe(PaymentStatus.PAID);
    expect(unchanged?.paymentProviderSessionId).toBe(webhookSessionId);
  });

  it('handles concurrent webhooks with exactly one paid transition', async () => {
    const organizer = await prisma.organizerAccount.create({
      data: {
        email: 'concurrent@example.com',
        passwordHash: 'hash',
        termsAcceptedAt: new Date(),
      },
    });

    const sessionId = 'placeholder_cs_concurrent';
    const purchase = await prisma.packagePurchase.create({
      data: {
        organizerId: organizer.id,
        packageType: 'FREE',
        participantLimit: 20,
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: 'placeholder',
        paymentProviderSessionId: sessionId,
      },
    });

    const webhookPayload = {
      type: 'checkout.session.completed',
      sessionId,
      packagePurchaseId: purchase.id,
    };
    const { body, signature } = signWebhookPayload(webhookPayload);

    const [firstResponse, secondResponse] = await Promise.all([
      postSignedWebhook(body, signature),
      postSignedWebhook(body, signature),
    ]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstResponse.body.processed).toBe(true);
    expect(secondResponse.body.processed).toBe(true);
    expect(firstResponse.body.paymentStatus).toBe(PaymentStatus.PAID);
    expect(secondResponse.body.paymentStatus).toBe(PaymentStatus.PAID);

    const purchases = await prisma.packagePurchase.findMany();
    expect(purchases).toHaveLength(1);
    expect(purchases[0].paymentStatus).toBe(PaymentStatus.PAID);
    expect(purchases[0].purchasedAt).not.toBeNull();
  });

  it('does not expose another organizer purchases', async () => {
    const organizerOneToken = await registerOrganizer('owner-one@example.com');
    const organizerTwoToken = await registerOrganizer('owner-two@example.com');

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${organizerOneToken}`)
      .send({ packageType: 'FREE' })
      .expect(201);

    const purchasesForOwnerTwo = await request(app.getHttpServer())
      .get('/package-purchases')
      .set('Authorization', `Bearer ${organizerTwoToken}`)
      .expect(200);

    expect(purchasesForOwnerTwo.body).toEqual([]);

    const purchasesForOwnerOne = await request(app.getHttpServer())
      .get('/package-purchases')
      .set('Authorization', `Bearer ${organizerOneToken}`)
      .expect(200);

    expect(purchasesForOwnerOne.body).toHaveLength(1);
    expect(purchasesForOwnerOne.body[0].id).toBe(
      checkoutResponse.body.packagePurchaseId,
    );
  });

  it('handles concurrent markPackageAsUsed with exactly one used transition', async () => {
    const organizer = await prisma.organizerAccount.create({
      data: {
        email: 'concurrent-used@example.com',
        passwordHash: 'hash',
        termsAcceptedAt: new Date(),
      },
    });

    const purchase = await prisma.packagePurchase.create({
      data: {
        organizerId: organizer.id,
        packageType: 'FREE',
        participantLimit: 20,
        paymentStatus: PaymentStatus.PAID,
        paymentProvider: 'placeholder',
        paymentProviderSessionId: 'placeholder_cs_paid',
        purchasedAt: new Date(),
      },
    });

    const packagesService = app.get(PackagesService);

    const [firstResult, secondResult] = await Promise.allSettled([
      packagesService.markPackageAsUsed(organizer.id, purchase.id),
      packagesService.markPackageAsUsed(organizer.id, purchase.id),
    ]);

    const fulfilled = [firstResult, secondResult].filter(
      (result) => result.status === 'fulfilled',
    );
    const rejected = [firstResult, secondResult].filter(
      (result) => result.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    if (fulfilled[0].status === 'fulfilled') {
      expect(fulfilled[0].value.paymentStatus).toBe(PaymentStatus.USED);
      expect(fulfilled[0].value.usedAt).not.toBeNull();
    }

    const updated = await prisma.packagePurchase.findUnique({
      where: { id: purchase.id },
    });

    expect(updated?.paymentStatus).toBe(PaymentStatus.USED);
    expect(updated?.usedAt).not.toBeNull();

    const events = await prisma.event.findMany({
      where: { packagePurchaseId: purchase.id },
    });
    expect(events).toHaveLength(0);
  });

  it('marks a paid package as used and rejects reuse', async () => {
    const accessToken = await registerOrganizer('used-package@example.com');

    const checkoutResponse = await request(app.getHttpServer())
      .post('/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packageType: 'FREE' })
      .expect(201);

    const webhookPayload = {
      type: 'checkout.session.completed',
      sessionId: checkoutResponse.body.checkoutSessionId,
      packagePurchaseId: checkoutResponse.body.packagePurchaseId,
    };
    const { body, signature } = signWebhookPayload(webhookPayload);

    await postSignedWebhook(body, signature).expect(200);

    const packagesService = app.get(PackagesService);
    const organizer = await prisma.organizerAccount.findUnique({
      where: { email: 'used-package@example.com' },
    });

    const usedPurchase = await packagesService.markPackageAsUsed(
      organizer!.id,
      checkoutResponse.body.packagePurchaseId,
    );

    expect(usedPurchase.paymentStatus).toBe(PaymentStatus.USED);
    expect(usedPurchase.usedAt).not.toBeNull();

    await expect(
      packagesService.assertPackageAvailableForEventCreation(
        organizer!.id,
        checkoutResponse.body.packagePurchaseId,
      ),
    ).rejects.toThrow();
  });
});
