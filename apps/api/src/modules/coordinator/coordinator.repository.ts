import { Injectable } from '@nestjs/common';
import { CoordinatorAccess, Event } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CoordinatorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEventById(eventId: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  createCoordinatorAccess(data: {
    eventId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<CoordinatorAccess> {
    return this.prisma.coordinatorAccess.create({
      data: {
        eventId: data.eventId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        isActive: true,
      },
    });
  }

  findCoordinatorAccessById(
    accessId: string,
  ): Promise<CoordinatorAccess | null> {
    return this.prisma.coordinatorAccess.findUnique({
      where: { id: accessId },
    });
  }

  findCoordinatorAccessByHash(
    tokenHash: string,
  ): Promise<(CoordinatorAccess & { event: Event }) | null> {
    return this.prisma.coordinatorAccess.findFirst({
      where: { tokenHash },
      include: { event: true },
    });
  }

  revokeCoordinatorAccess(accessId: string): Promise<CoordinatorAccess> {
    return this.prisma.coordinatorAccess.update({
      where: { id: accessId },
      data: {
        revokedAt: new Date(),
        isActive: false,
      },
    });
  }
}
