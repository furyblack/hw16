import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../application/session.service';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { Cookies } from '../decarators/cookies.decorator';
import { RefreshTokenGuardPower } from '../guards/bearer/refresh-guard v2.0';

@Controller('security')
export class SecurityDevicesController {
  constructor(
    private sessionService: SessionService,
    private jwtService: JwtService,
  ) {}

  @Get('devices')
  @UseGuards(RefreshTokenGuardPower)
  async getDevices(@ExtractUserFromRequest() user: UserContextDto) {
    const sessions = await this.sessionService.findAllSessionsForUser(
      user.userId,
    );
    return sessions.map((session) => ({
      ip: session.ip,
      title: session.title,
      lastActiveDate: session.lastActiveDate,
      deviceId: session.deviceId,
    }));
  }

  @Delete('devices')
  @UseGuards(RefreshTokenGuardPower)
  async terminateOtherSessions(
    @ExtractUserFromRequest() user: UserContextDto,
    @Cookies('refreshToken') refreshToken: string,
  ) {
    const payload = this.jwtService.verify(refreshToken);
    await this.sessionService.deleteAllOtherSessions(
      user.userId,
      payload.deviceId,
    );
    // Возвращаем 204 без тела
  }

  @Delete('devices/:deviceId')
  @UseGuards(RefreshTokenGuardPower)
  async terminateDevice(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param('deviceId') deviceId: string,
  ) {
    await this.sessionService.terminateSpecificSession(user.userId, deviceId);
    // Возвращаем 204 без тела
  }
}
