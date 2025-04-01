import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateUserDto } from '../../src/moduls/user-accounts/dto/create-user.dto';
import { EmailService } from '../../src/moduls/notifications/email.service';

export class AuthTestManager {
  constructor(
    private app: INestApplication,
    private emailService: EmailService,
  ) {}

  async registerUser(
    registerModel: CreateUserDto,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    // Мокаем без resolvedValue(true), если сервис ожидает void
    jest
      .spyOn(this.emailService, 'sendConfirmationEmail')
      .mockImplementation(() => Promise.resolve());

    await request(this.app.getHttpServer())
      .post('/api/auth/registration')
      .send(registerModel)
      .expect(expectedStatus);
  }

  async login(
    credentials: { loginOrEmail: string; password: string },
    expectedStatus: number = HttpStatus.OK,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({
        loginOrEmail: credentials.loginOrEmail,
        password: credentials.password,
      })
      .expect(expectedStatus);

    const refreshToken = this.extractRefreshToken(response);
    return {
      accessToken: response.body?.accessToken,
      refreshToken,
    };
  }

  async getMe(accessToken: string, expectedStatus: number = HttpStatus.OK) {
    return request(this.app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);
  }

  private extractRefreshToken(response: request.Response): string | undefined {
    const cookieHeader = response.headers['set-cookie']?.[0];
    if (!cookieHeader) return undefined;

    return cookieHeader.split(';')[0].split('=')[1];
  }
}
