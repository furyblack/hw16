import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../application/session.service';

@Injectable()
export class RefreshTokenGuardPower implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private sessionService: SessionService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not provided');

    try {
      const payload = this.jwtService.verify(refreshToken);
      const session = await this.sessionService.findSessionByDeviceId(
        payload.deviceId,
      );
      if (!session) throw new UnauthorizedException('Session not found');

      request.user = payload;
      return true;
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
