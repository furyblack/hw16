import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../application/session.service';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { Cookies } from '../decarators/cookies.decorator';

@Controller('security')
export class SecurityDevicesController {
  constructor(
    private sessionService: SessionService,
    private jwtService: JwtService,
  ) {}

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async getDevices(@ExtractUserFromRequest() user: UserContextDto) {
    return this.sessionService.findAllSessionsForUser(user.userId);
  }

  @Delete('devices')
  @UseGuards(JwtAuthGuard)
  async terminateOtherSessions(
    @ExtractUserFromRequest() user: UserContextDto,
    @Cookies('refreshToken') refreshToken: string,
  ) {
    const payload = this.jwtService.verify(refreshToken);
    await this.sessionService.deleteAllOtherSessions(
      user.userId,
      payload.deviceId,
    );
    return { statusCode: 204 };
  }

  @Delete('devices/:deviceId')
  @UseGuards(JwtAuthGuard)
  async terminateDevice(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param('deviceId') deviceId: string,
  ) {
    await this.sessionService.terminateSpecificSession(user.userId, deviceId);
    return { statusCode: 204 };
  }
}
