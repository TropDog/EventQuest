import { Injectable } from '@nestjs/common';
import { OrganizerAccount, OrganizerRefreshToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrganizerByEmail(email: string): Promise<OrganizerAccount | null> {
    return this.prisma.organizerAccount.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findOrganizerById(id: string): Promise<OrganizerAccount | null> {
    return this.prisma.organizerAccount.findUnique({
      where: { id },
    });
  }

  createOrganizer(data: {
    email: string;
    passwordHash: string;
    termsAcceptedAt: Date;
  }): Promise<OrganizerAccount> {
    return this.prisma.organizerAccount.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        termsAcceptedAt: data.termsAcceptedAt,
      },
    });
  }

  createRefreshToken(data: {
    organizerId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<OrganizerRefreshToken> {
    return this.prisma.organizerRefreshToken.create({
      data,
    });
  }

  findRefreshTokenByHash(
    tokenHash: string,
  ): Promise<(OrganizerRefreshToken & { organizer: OrganizerAccount }) | null> {
    return this.prisma.organizerRefreshToken.findUnique({
      where: { tokenHash },
      include: { organizer: true },
    });
  }

  revokeRefreshToken(id: string): Promise<OrganizerRefreshToken> {
    return this.prisma.organizerRefreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
