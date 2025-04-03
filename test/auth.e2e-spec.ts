import { HttpStatus, INestApplication } from '@nestjs/common';
import { AuthTestManager } from './helpers/auth-test-manager';
import { initSettings } from './helpers/init-settings';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let authTestManager: AuthTestManager;

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder.overrideProvider(JwtService).useValue(
        new JwtService({
          secret: 'access-token-secret',
          signOptions: { expiresIn: '15m' }, // Увеличил для стабильности тестов
        }),
      );
    });

    app = result.app;

    authTestManager = result.authTestManager;
  });
  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('Registration + Login flow', () => {
    const testUser = {
      login: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!',
    };

    it('should register user (204)', async () => {
      await authTestManager.registerUser(testUser, HttpStatus.NO_CONTENT);
    });

    it('should login with correct credentials (200)', async () => {
      // Arrange
      await authTestManager.registerUser(testUser);

      // Act
      const { accessToken, refreshToken } = await authTestManager.login({
        loginOrEmail: testUser.login,
        password: testUser.password,
      });

      // Assert
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    it('should return me data (200)', async () => {
      // Arrange
      await authTestManager.registerUser(testUser);
      const { accessToken } = await authTestManager.login({
        loginOrEmail: testUser.login,
        password: testUser.password,
      });

      // Act
      const meResponse = await authTestManager.getMe(accessToken);

      // Assert
      expect(meResponse.status).toBe(HttpStatus.OK);
      expect(meResponse.body).toEqual({
        login: testUser.login,
        email: testUser.email,
        userId: expect.any(String), // Добавляем ожидание поля userId
      });
    });
  });
});
