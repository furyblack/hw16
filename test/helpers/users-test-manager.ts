import { HttpStatus, INestApplication } from '@nestjs/common';
import { CreateUserInputDto } from '../../src/moduls/user-accounts/api/input-dto/users.input-dto';
import { UserViewDto } from '../../src/moduls/user-accounts/api/view-dto/users.view-dto';
import request from 'supertest';
import { delay } from './delay';
import {
  User,
  UserDocument,
  UserModelType,
} from '../../src/moduls/user-accounts/domain/user.entity';

export class UsersTestManager {
  constructor(private app: INestApplication) {}
  async createUser(
    createModel: CreateUserInputDto,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<UserViewDto> {
    const response = await request(this.app.getHttpServer())
      .post('/api/users')
      .auth('admin', 'qwerty')
      .send(createModel)
      .expect(statusCode);
    return response.body;
  }

  async createSeveralUsers(count: number): Promise<UserViewDto[]> {
    const usersPromises = [] as Promise<UserViewDto>[];
    for (let i = 0; i < count; ++i) {
      await delay(50);
      const response = this.createUser({
        login: `test` + i,
        email: `test${i}@gmail.com`,
        password: '123456789',
      });
      usersPromises.push(response);
    }
    return Promise.all(usersPromises);
  }

  async deleteUser(id: string) {
    const server = this.app.getHttpServer(); // получаем сервер для тестов
    await request(server)
      .delete(`/api/users/${id}`)
      .auth('admin', 'qwerty')
      .expect(204);
  }

  async findUserById(id: string) {
    const server = this.app.getHttpServer(); // получаем сервер для тестов
    await request(server).get(`/api/users/${id}`);
  }
}
