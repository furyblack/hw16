import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { UsersRepository } from './infrastructure/users.repository';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { SecurityDevicesQueryRepository } from './infrastructure/query/security-devices.query-repository';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { AuthService } from './application/auth.service';
import { LocalStrategy } from './guards/local/local.strategy';
import { CryptoService } from './application/crypto.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './api/auth.controller';
import { SecurityDevicesController } from './api/security-devices.controller';
import { CreateUserUseCase } from './use-cases/create-user-use-case';
import { RegisterUserUseCase } from './use-cases/register-user-use-case';
import { DeleteUserUseCase } from './use-cases/delete-user-use-case';

@Module({
  imports: [
    //если в системе несколько токенов (например, access и refresh) с разными опциями (время жизни, секрет)
    //можно переопределить опции при вызове метода jwt.service.sign
    //или написать свой tokens сервис (адаптер), где эти опции будут уже учтены
    //или использовать useFactory и регистрацию через токены для JwtService,
    //для создания нескольких экземпляров в IoC с разными настройками (пример в следующих занятиях)
    JwtModule.register({
      secret: 'access-token-secret', //TODO: move to env. will be in the following lessons
      signOptions: { expiresIn: '60m' }, // Время жизни токена
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
  ],

  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    UsersService,
    UsersRepository,
    UsersQueryRepository,
    SecurityDevicesQueryRepository,
    AuthQueryRepository,
    //LoginIsExistConstraint,
    AuthService,
    LocalStrategy,
    CryptoService,
    JwtStrategy,
    CreateUserUseCase,
    RegisterUserUseCase,
    DeleteUserUseCase,
  ],

  exports: [
    UsersRepository,
    MongooseModule,
    JwtStrategy,
    /* MongooseModule реэкспорт делаем, если хотим чтобы зарегистрированные здесь модельки могли
    инджектиться в сервисы других модулей, которые импортнут этот модуль */
  ],
})
export class UserAccountsModule {}
