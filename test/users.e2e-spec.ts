import { CreateUserDto } from '../src/moduls/user-accounts/dto/create-user.dto';
import { UsersTestManager } from './helpers/users-test-manager';
import { JwtService } from '@nestjs/jwt';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from './helpers/init-settings';
import { deleteAllData } from './helpers/delete-all-data';
import request from 'supertest';
import { PaginatedViewDto } from '../src/core/dto/base.paginated.view-dto';
import { UserViewDto } from '../src/moduls/user-accounts/api/view-dto/users.view-dto';

describe('users', () => {
  // const basicAuthHeader =
  //   'Basic ' + Buffer.from('admin:qwerty').toString('base64');
  let app: INestApplication;
  let userTestManger: UsersTestManager;
  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) => {
      moduleBuilder.overrideProvider(JwtService).useValue(
        new JwtService({
          secret: 'access-token-secret',
          signOptions: { expiresIn: '2s' },
        }),
      );
    });
    app = result.app;
    userTestManger = result.userTestManger;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });
  it('should create a new user', async () => {
    const body: CreateUserDto = {
      login: 'admin',
      password: 'qwerty',
      email: 'email@email.em',
    };

    const response = await userTestManger.createUser(body);
    expect(response).toEqual({
      login: body.login,
      email: body.email,
      id: expect.any(String),
      createdAt: expect.any(String),
    });
  });
  it('should get users with paging', async () => {
    const users = await userTestManger.createSeveralUsers(12);
    const { body: responseBody } = (await request(app.getHttpServer())
      .get(`/api/users?pageNumber=2&sortDirection=asc`)
      .expect(HttpStatus.OK)) as { body: PaginatedViewDto<UserViewDto> };

    expect(responseBody.totalCount).toBe(12);
    expect(responseBody.items).toHaveLength(2);
    expect(responseBody.pagesCount).toBe(2);
    //asc sorting
    expect(responseBody.items[1]).toEqual(users[users.length - 1]);
    //etc...
  });
  it('should delete user by id', async () => {
    // сначала создаем юзера
    const body: CreateUserDto = {
      login: 'name1',
      password: 'qwerty',
      email: 'email@email.em',
    };

    const createdUser = await userTestManger.createUser(body);
    // удаляем пользователя
    await userTestManger.deleteUser(createdUser.id);
    // проверяем что удалился
    const server = app.getHttpServer();
    await request(server)
      .get(`/api/users/${createdUser.id}`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.NOT_FOUND);
  });
});
