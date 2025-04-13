import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { SessionService } from '../application/session.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private sessionService: SessionService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refreshToken,
      ]),
      secretOrKey: 'your-strong-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const session = await this.sessionService.findSessionByDeviceId(
      payload.deviceId,
    );
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.lastActiveDate !== payload.iat) {
      throw new UnauthorizedException(
        'Refresh token has been used or is invalid',
      );
    }

    return payload;
  }
}
