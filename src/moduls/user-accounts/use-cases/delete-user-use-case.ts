import { UsersRepository } from '../infrastructure/users.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteUserUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute(id: string) {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.makeDeleted();
    await this.usersRepository.save(user);
  }
}
