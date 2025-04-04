import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from './crypto.service';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { EmailService } from '../../notifications/email.service';
import { BadRequestDomainException } from '../../../core/exceptions/domain-exceptions';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    readonly usersService: UsersService,
    private emailService: EmailService,
  ) {}

  // Генерация accessToken
  private generateAccessToken(userId: string, login: string): string {
    return this.jwtService.sign(
      { id: userId, login },
      { expiresIn: '10s' }, // accessToken действует 15 минут
    );
  }

  // Генерация refreshToken
  private generateRefreshToken(userId: string, login: string): string {
    return this.jwtService.sign(
      { id: userId, login },
      { expiresIn: '20s' }, // refreshToken действует 7 дней
    );
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

  async login(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const accessToken = this.generateAccessToken(userId, user.login);
    const refreshToken = this.generateRefreshToken(userId, user.login);
    return {
      accessToken,
      refreshToken,
    };
  }
  async register(dto: CreateUserDto) {
    const loginExists = await this.usersService.isLoginTaken(dto.login);
    if (loginExists) {
      throw new BadRequestException('Login already exists');
    }

    return this.usersService.createUser(dto);
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
