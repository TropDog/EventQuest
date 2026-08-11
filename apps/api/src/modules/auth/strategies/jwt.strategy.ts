import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';

export interface OrganizerJwtPayload {
  sub: string;
  email: string;
  type: 'access';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    const secret = configService.get<string>('jwt.accessSecret');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: OrganizerJwtPayload): Promise<OrganizerJwtPayload> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const organizer = await this.authRepository.findOrganizerById(payload.sub);
    if (!organizer) {
      throw new UnauthorizedException('Organizer not found');
    }

    return {
      sub: organizer.id,
      email: organizer.email,
      type: 'access',
    };
  }
}
