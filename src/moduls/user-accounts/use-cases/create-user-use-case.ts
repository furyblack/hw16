import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from '../application/crypto.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { BadRequestDomainException } from '../../../core/exceptions/domain-exceptions';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
  ) {}

  async execute(dto: CreateUserDto) {
    // Проверяем, существует ли пользователь с таким логином
    const userWithTheSameLogin = await this.usersRepository.findByLogin(
      dto.login,
    );
    if (userWithTheSameLogin) {
      throw BadRequestDomainException.create(
        'User with the same login already exists',
        'login',
      );
    }

    //Проверяем, существует ли пользователь с таким email
    const userWithTheSameEmail = await this.usersRepository.findByEmail(
      dto.email,
    );
    if (userWithTheSameEmail) {
      throw BadRequestDomainException.create(
        'User with the same email already exists',
        'email',
      );
    }
    // Хешируем пароль
    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    // Создаем пользователя через репозиторий
    const user = await this.usersRepository.createUser({
      email: dto.email,
      login: dto.login,
      passwordHash,
    });

    return user._id;
  }
}
