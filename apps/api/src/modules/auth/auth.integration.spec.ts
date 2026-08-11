import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../../common/utils/token-hash';

describe('AuthController (integration)', () => {
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
  });

  afterEach(async () => {
    await prisma.organizerRefreshToken.deleteMany();
    await prisma.organizerAccount.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers an organizer, stores a hashed password, and returns tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'organizer@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    expect(response.body.organizer.email).toBe('organizer@example.com');
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.organizer.passwordHash).toBeUndefined();

    const stored = await prisma.organizerAccount.findUnique({
      where: { email: 'organizer@example.com' },
    });

    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toBe('secret-password');
    expect(await bcrypt.compare('secret-password', stored!.passwordHash)).toBe(
      true,
    );

    const storedRefresh = await prisma.organizerRefreshToken.findUnique({
      where: { tokenHash: hashToken(response.body.refreshToken) },
    });
    expect(storedRefresh).not.toBeNull();
    expect(storedRefresh?.tokenHash).not.toBe(response.body.refreshToken);
  });

  it('rejects invalid registration input', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(400);
  });

  it('rejects duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(409);
  });

  it('rejects registration when terms are not accepted', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'noterms@example.com',
        password: 'secret-password',
        termsAccepted: false,
      })
      .expect(400);
  });

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'login@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login@example.com',
        password: 'secret-password',
      })
      .expect(200);

    expect(loginResponse.body.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('returns authenticated organizer identity from /auth/me', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'me@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body.email).toBe('me@example.com');
    expect(meResponse.body.passwordHash).toBeUndefined();

    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('refreshes access tokens without rotating the refresh token', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'refresh@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: registerResponse.body.refreshToken })
      .expect(200);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBe(
      registerResponse.body.refreshToken,
    );
  });

  it('rejects expired refresh tokens', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'expired@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    await prisma.organizerRefreshToken.update({
      where: { tokenHash: hashToken(registerResponse.body.refreshToken) },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: registerResponse.body.refreshToken })
      .expect(401);
  });

  it('rejects revoked refresh tokens', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'revoked@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    await prisma.organizerRefreshToken.update({
      where: { tokenHash: hashToken(registerResponse.body.refreshToken) },
      data: { revokedAt: new Date() },
    });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: registerResponse.body.refreshToken })
      .expect(401);
  });

  it('logout revokes the refresh token and prevents reuse', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'logout@example.com',
        password: 'secret-password',
        termsAccepted: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send({ refreshToken: registerResponse.body.refreshToken })
      .expect(200);

    const storedRefresh = await prisma.organizerRefreshToken.findUnique({
      where: { tokenHash: hashToken(registerResponse.body.refreshToken) },
    });
    expect(storedRefresh?.revokedAt).not.toBeNull();

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: registerResponse.body.refreshToken })
      .expect(401);
  });
});
