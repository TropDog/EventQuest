import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OrganizerAccount } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const organizer: OrganizerAccount = {
    id: 'org-1',
    email: 'organizer@example.com',
    passwordHash: '$2b$12$hashedpassword',
    termsAcceptedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    authRepository = {
      findOrganizerByEmail: jest.fn(),
      findOrganizerById: jest.fn(),
      createOrganizer: jest.fn(),
      createRefreshToken: jest.fn(),
      findRefreshTokenByHash: jest.fn(),
      revokeRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'jwt.refreshExpiresInDays') {
          return 7;
        }
        return defaultValue;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    authService = new AuthService(authRepository, jwtService, configService);
  });

  describe('register', () => {
    it('creates an organizer and returns auth tokens', async () => {
      authRepository.findOrganizerByEmail.mockResolvedValue(null);
      authRepository.createOrganizer.mockResolvedValue(organizer);
      authRepository.createRefreshToken.mockResolvedValue({
        id: 'rt-1',
        organizerId: organizer.id,
        tokenHash: 'hash',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });

      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

      const result = await authService.register({
        email: 'organizer@example.com',
        password: 'secret-password',
        termsAccepted: true,
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.organizer.email).toBe('organizer@example.com');
      expect(authRepository.createOrganizer).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'organizer@example.com',
          passwordHash: 'hashed-password',
        }),
      );
    });

    it('rejects duplicate organizer email', async () => {
      authRepository.findOrganizerByEmail.mockResolvedValue(organizer);

      await expect(
        authService.register({
          email: 'organizer@example.com',
          password: 'secret-password',
          termsAccepted: true,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      authRepository.findOrganizerByEmail.mockResolvedValue(organizer);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      authRepository.createRefreshToken.mockResolvedValue({
        id: 'rt-1',
        organizerId: organizer.id,
        tokenHash: 'hash',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });

      const result = await authService.login({
        email: 'organizer@example.com',
        password: 'secret-password',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.organizer.id).toBe('org-1');
    });

    it('rejects invalid password', async () => {
      authRepository.findOrganizerByEmail.mockResolvedValue(organizer);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        authService.login({
          email: 'organizer@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('issues a new access token without revoking the refresh token', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue({
        id: 'rt-1',
        organizerId: organizer.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        createdAt: new Date(),
        organizer,
      });

      const result = await authService.refresh('refresh-token');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
      expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects revoked refresh tokens', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue({
        id: 'rt-1',
        organizerId: organizer.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
        createdAt: new Date(),
        organizer,
      });

      await expect(authService.refresh('refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects expired refresh tokens', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue({
        id: 'rt-1',
        organizerId: organizer.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 60_000),
        revokedAt: null,
        createdAt: new Date(),
        organizer,
      });

      await expect(authService.refresh('refresh-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revokes the presented refresh token', async () => {
      authRepository.findRefreshTokenByHash.mockResolvedValue({
        id: 'rt-1',
        organizerId: 'org-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        createdAt: new Date(),
        organizer,
      });

      await authService.logout('org-1', 'refresh-token');

      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('rt-1');
    });
  });
});
