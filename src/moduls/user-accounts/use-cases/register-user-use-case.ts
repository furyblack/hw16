import { CreateUserDto } from '../dto/create-user.dto';
import { CreateUserUseCase } from './create-user-use-case';
import { UsersRepository } from '../infrastructure/users.repository';
import { EmailService } from '../../notifications/email.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private usersRepository: UsersRepository,
    private emailService: EmailService,
  ) {}

  async execute(dto: CreateUserDto) {
    const createdUserId = await this.createUserUseCase.execute(dto);

    const confirmCode = 'uuid';

    const user = await this.usersRepository.findOrNotFoundFail(
      createdUserId.toString(),
    );

    user.setConfirmationCode(confirmCode);
    await this.usersRepository.save(user);

    this.emailService
      .sendConfirmationEmail(user.email, confirmCode)
      .catch(console.error);
  }
}
