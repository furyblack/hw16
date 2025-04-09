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
import { Response } from 'express'; // Импортируем Response из express
import { AuthService } from '../application/auth.service';
import { AuthQueryRepository } from '../infrastructure/query/auth.query-repository';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../guards/decorators/param/extract-user-from-request.decorator';
import { Nullable, UserContextDto } from '../guards/dto/user-context.dto';
import { MeViewDto } from './view-dto/users.view-dto';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { JwtOptionalAuthGuard } from '../guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../guards/decorators/param/extract-user-if-exists-from-request.decorator';
import {
  ConfirmRegistrationDto,
  PasswordRecoveryDto,
} from '../dto/confirm-registration-dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Cookies } from '../decarators/cookies.decorator';
import { Request } from 'express';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { AccessTokenGuard } from '../guards/cookies-guard';

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
      user.id,
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
    console.log('Received refreshToken:', refreshToken); // Добавьте лог

    if (!refreshToken) {
      console.log('Refresh token not provided'); // Лог
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
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Cookies('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      // Проверяем токен перед удалением сессии
      const payload = this.jwtService.verify(refreshToken);
      await this.authService.logout(payload.deviceId);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        // Для истёкшего токена возвращаем 401
        throw new UnauthorizedException('Refresh token expired');
      }
      // Для невалидного токена тоже 401
      throw new UnauthorizedException('Invalid refresh token');
    } finally {
      response.clearCookie('refreshToken');
    }
  }

  @ApiBearerAuth()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@ExtractUserFromRequest() user: UserContextDto): Promise<MeViewDto> {
    return this.authQueryRepository.me(user.id);
  }

  @ApiBearerAuth()
  @Get('me-or-default')
  @UseGuards(JwtOptionalAuthGuard)
  async meOrDefault(
    @ExtractUserIfExistsFromRequest() user: UserContextDto,
  ): Promise<Nullable<MeViewDto>> {
    if (user) {
      return this.authQueryRepository.me(user.id!);
    } else {
      return {
        login: 'anonymous',
        userId: null,
        email: null,
      };
    }
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
