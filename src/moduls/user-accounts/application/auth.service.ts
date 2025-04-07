import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from './crypto.service';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UsersService } from './users.service';
import { EmailService } from '../../notifications/email.service';
import { BadRequestDomainException } from '../../../core/exceptions/domain-exceptions';
import { SessionService } from './session.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    readonly usersService: UsersService,
    private emailService: EmailService,
    private sessionService: SessionService,
  ) {}

  private generateAccessToken(userId: string, login: string): string {
    return this.jwtService.sign({ userId, login }, { expiresIn: '10s' });
  }

  private generateRefreshToken(userId: string, deviceId: string): string {
    return this.jwtService.sign({ userId, deviceId }, { expiresIn: '20s' });
  }

  async login(userId: string, ip: string, userAgent: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const deviceId = randomUUID();
    const accessToken = this.generateAccessToken(user.id, user.login);
    const refreshToken = this.generateRefreshToken(user.id, deviceId);

    await this.sessionService.createSession({
      ip,
      title: userAgent,
      deviceId,
      userId: user.id,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken);
      if (!payload?.userId || !payload?.deviceId) {
        throw new BadRequestException('Invalid refresh token');
      }

      const session = await this.sessionService.findSessionByDeviceId(
        payload.deviceId,
      );
      if (!session) {
        throw new BadRequestException('Session not found');
      }

      const user = await this.usersRepository.findById(payload.userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const newAccessToken = this.generateAccessToken(user.id, user.login);
      const newRefreshToken = this.generateRefreshToken(
        user.id,
        payload.deviceId,
      );

      await this.sessionService.updateSessionLastActiveDate(payload.deviceId);

      return { newAccessToken, newRefreshToken };
    } catch (e) {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      await this.sessionService.deleteSessionByDeviceId(payload.deviceId);
    } catch (e) {
      // Логируем ошибку, но не прерываем выполнение
      console.error('Error during logout:', e);
    }
  }
  async validateUser(
    login: string,
    password: string,
  ): Promise<UserContextDto | null> {
    const user = await this.usersRepository.findByLogin(login);
    if (!user) {
      return null;
    }
    const isPasswordValid = await this.cryptoService.comparePasswords({
      password,
      hash: user.passwordHash,
    });

    if (!isPasswordValid) {
      return null;
    }

    return { id: user.id.toString() };
  }

  async confirmRegistration(code: string): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(code);

    if (!user) {
      throw new BadRequestDomainException([
        { message: 'Invalid confirmation code', key: 'code' },
      ]);
    }

    if (user.isEmailConfirmed) {
      throw new BadRequestDomainException([
        { message: 'User already confirmed', key: 'code' },
      ]);
    }

    if (
      user.confirmationCodeExpiration &&
      user.confirmationCodeExpiration < new Date()
    ) {
      throw new BadRequestDomainException([
        { message: 'Confirmation code expired', key: 'code' },
      ]);
    }

    user.isEmailConfirmed = true;
    user.confirmationCode = null; // Теперь это допустимо, так как confirmationCode может быть строкой или null
    user.confirmationCodeExpiration = null; // То же самое для confirmationCodeExpiration

    await user.save();
  }

  async passwordRecovery(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestDomainException([
        { message: 'Such user not found', key: 'email' },
      ]);
    }
  }

  async emailResending(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestDomainException([
        { message: 'Such user not found', key: 'email' },
      ]);
    }
    if (user.isEmailConfirmed) {
      throw new BadRequestDomainException([
        { message: 'User already confirmed', key: 'email' },
      ]);
    }
    const newconfirmCode = 'newuuid';
    user.setConfirmationCode(newconfirmCode);
    await this.usersRepository.save(user);
    await this.emailService
      .sendConfirmationEmail(user.email, newconfirmCode)
      .catch(console.error);
  }
}
