import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OrganizerAccount } from '@prisma/client';
import type { AuthResponse } from '@eventquest/shared';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { toOrganizerProfile } from './dto/organizer-profile.mapper';
import {
  generateRefreshToken,
  hashToken,
} from '../../common/utils/token-hash';
import { OrganizerJwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.authRepository.findOrganizerByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An organizer account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const organizer = await this.authRepository.createOrganizer({
      email: dto.email,
      passwordHash,
      termsAcceptedAt: new Date(),
    });

    return this.issueAuthResponse(organizer);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const organizer = await this.authRepository.findOrganizerByEmail(dto.email);
    if (!organizer) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      organizer.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueAuthResponse(organizer);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = hashToken(refreshToken);
    const storedToken =
      await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = await this.createAccessToken(
      storedToken.organizer.id,
      storedToken.organizer.email,
    );

    return {
      organizer: toOrganizerProfile(storedToken.organizer),
      accessToken,
      refreshToken,
    };
  }

  async logout(
    organizerId: string,
    refreshToken: string,
  ): Promise<{ success: true }> {
    const tokenHash = hashToken(refreshToken);
    const storedToken =
      await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken || storedToken.organizerId !== organizerId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!storedToken.revokedAt) {
      await this.authRepository.revokeRefreshToken(storedToken.id);
    }

    return { success: true };
  }

  async getMe(organizerId: string) {
    const organizer = await this.authRepository.findOrganizerById(organizerId);
    if (!organizer) {
      throw new UnauthorizedException('Organizer not found');
    }

    return toOrganizerProfile(organizer);
  }

  private async issueAuthResponse(
    organizer: OrganizerAccount,
  ): Promise<AuthResponse> {
    const accessToken = await this.createAccessToken(organizer.id, organizer.email);
    const refreshToken = await this.createRefreshToken(organizer.id);

    return {
      organizer: toOrganizerProfile(organizer),
      accessToken,
      refreshToken,
    };
  }

  private async createAccessToken(
    organizerId: string,
    email: string,
  ): Promise<string> {
    const payload: OrganizerJwtPayload = {
      sub: organizerId,
      email,
      type: 'access',
    };

    return this.jwtService.signAsync(payload);
  }

  private async createRefreshToken(organizerId: string): Promise<string> {
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const refreshExpiresInDays = this.configService.get<number>(
      'jwt.refreshExpiresInDays',
      7,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

    await this.authRepository.createRefreshToken({
      organizerId,
      tokenHash,
      expiresAt,
    });

    return refreshToken;
  }
}
