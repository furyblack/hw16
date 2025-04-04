import { UsersService } from '../application/users.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
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

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private authQueryRepository: AuthQueryRepository,
  ) {}

  @Post('registration')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  registration(@Body() body: CreateUserInputDto): Promise<void> {
    return this.usersService.registerUser(body);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @ExtractUserFromRequest() user: UserContextDto,
    @Res({ passthrough: true }) response: Response, // Используем @Res для установки cookie
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.authService.login(user.id);

    // Устанавливаем refreshToken в cookie
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Защита от XSS
      secure: true, // В production используем HTTPS
      maxAge: 20 * 1000, // 20 сек
    });

    // Возвращаем accessToken в теле ответа
    return { accessToken };
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
