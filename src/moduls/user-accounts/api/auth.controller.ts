import { UsersService } from '../application/users.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../application/auth.service';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { MeViewDto } from './view-dto/users.view-dto';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import {
  ConfirmRegistrationDto,
  PasswordRecoveryDto,
} from '../dto/confirm-registration-dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Cookies } from '../decarators/cookies.decorator';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenGuardR } from '../guards/refresh-token-guard v2';

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private jwtService: JwtService,
    private authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('registration')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.usersService.registerUser(body);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @ExtractUserFromRequest() user: UserContextDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const userAgent = request.headers['user-agent'] ?? 'unknown'; // Используем nullish coalescing
    const ip = request.ip ?? 'unknown'; // На всякий случай обрабатываем и ip

    const { accessToken, refreshToken } = await this.authService.login(
      user.userId,
      ip,
      userAgent,
    );

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 20 * 1000,
    });

    return { accessToken };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('Received refreshToken:', refreshToken);

    if (!refreshToken) {
      console.log('Refresh token not provided');
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      const { newAccessToken, newRefreshToken } =
        await this.authService.refreshToken(refreshToken);
      console.log('Generated new tokens:', { newAccessToken, newRefreshToken });

      response.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 20 * 1000,
      });

      return { accessToken: newAccessToken };
    } catch (e) {
      console.error('Error in refresh-token:', e); // Лог ошибки
      response.clearCookie('refreshToken');
      throw e;
    }
  }

  @Post('logout')
  @UseGuards(RefreshTokenGuardR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { deviceId: string };

    await this.authService.logout(user.deviceId); // деактивировать сессию
    res.clearCookie('refreshToken');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    console.log(`user`, user);
    const x = await this.authQueryRepository.me(user.userId);
    console.log(x);
    return x;
  }

  @Post('registration-confirmation')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT) // 204 при успешном подтверждении
  async confirmRegistration(
    @Body() dto: ConfirmRegistrationDto,
  ): Promise<void> {
    await this.authService.confirmRegistration(dto.code);
  }

  @Post('password-recovery')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: PasswordRecoveryDto): Promise<void> {
    await this.authService.passwordRecovery(dto.email);
  }

  @Post('registration-email-resending')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async emailResending(@Body() dto: PasswordRecoveryDto): Promise<void> {
    await this.authService.emailResending(dto.email);
  }
}
