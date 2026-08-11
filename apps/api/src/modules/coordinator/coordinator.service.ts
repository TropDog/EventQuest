import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoordinatorAccess } from '@prisma/client';
import type {
  CreateCoordinatorAccessResponse,
  ResolveCoordinatorAccessResponse,
  RevokeCoordinatorAccessResponse,
} from '@eventquest/shared';
import {
  generateOpaqueToken,
  hashToken,
} from '../../common/utils/token-hash';
import { CoordinatorRepository } from './coordinator.repository';
import {
  toCoordinatorAccessProfile,
  toCoordinatorEventContext,
} from './dto/coordinator-access.mapper';
import { CoordinatorAccessPayload } from './coordinator.types';

export type { CoordinatorAccessPayload };

@Injectable()
export class CoordinatorService {
  constructor(
    private readonly coordinatorRepository: CoordinatorRepository,
    private readonly configService: ConfigService,
  ) {}

  async createCoordinatorAccess(
    organizerId: string,
    eventId: string,
  ): Promise<CreateCoordinatorAccessResponse> {
    const event = await this.coordinatorRepository.findEventById(eventId);
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Event not found');
    }

    const token = generateOpaqueToken();
    const tokenHash = hashToken(token);
    const expiresAt = this.calculateExpiresAt();

    const access = await this.coordinatorRepository.createCoordinatorAccess({
      eventId,
      tokenHash,
      expiresAt,
    });

    return {
      coordinatorAccess: toCoordinatorAccessProfile(access),
      token,
    };
  }

  async revokeCoordinatorAccess(
    organizerId: string,
    eventId: string,
    accessId: string,
  ): Promise<RevokeCoordinatorAccessResponse> {
    const event = await this.coordinatorRepository.findEventById(eventId);
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Event not found');
    }

    const access =
      await this.coordinatorRepository.findCoordinatorAccessById(accessId);
    if (!access || access.eventId !== eventId) {
      throw new NotFoundException('Coordinator access not found');
    }

    if (!access.revokedAt) {
      await this.coordinatorRepository.revokeCoordinatorAccess(accessId);
    }

    return { success: true };
  }

  async resolveCoordinatorAccess(
    token: string,
  ): Promise<ResolveCoordinatorAccessResponse> {
    const tokenHash = hashToken(token);
    const access =
      await this.coordinatorRepository.findCoordinatorAccessByHash(tokenHash);

    if (!access || !this.isAccessValid(access)) {
      throw new UnauthorizedException(
        'Invalid or expired coordinator access token',
      );
    }

    return {
      coordinatorAccess: toCoordinatorAccessProfile(access),
      event: toCoordinatorEventContext(access.event),
    };
  }

  async validateCoordinatorToken(
    token: string,
  ): Promise<CoordinatorAccessPayload> {
    const tokenHash = hashToken(token);
    const access =
      await this.coordinatorRepository.findCoordinatorAccessByHash(tokenHash);

    if (!access || !this.isAccessValid(access)) {
      throw new UnauthorizedException(
        'Invalid or expired coordinator access token',
      );
    }

    return {
      accessId: access.id,
      eventId: access.eventId,
      type: 'coordinator',
    };
  }

  isAccessValid(access: CoordinatorAccess): boolean {
    if (!access.isActive || access.revokedAt) {
      return false;
    }

    if (access.expiresAt && access.expiresAt <= new Date()) {
      return false;
    }

    return true;
  }

  private calculateExpiresAt(): Date {
    const expiresInDays = this.configService.get<number>(
      'coordinator.accessExpiresInDays',
      30,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    return expiresAt;
  }
}
