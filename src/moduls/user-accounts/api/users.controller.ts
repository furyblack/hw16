import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { UserViewDto } from './view-dto/users.view-dto';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { ApiBasicAuth } from '@nestjs/swagger';
import { Public } from '../guards/decorators/public.decorator';
import { CreateUserUseCase } from '../use-cases/create-user-use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user-use-case';

@Controller('users')
@UseGuards(BasicAuthGuard)
@ApiBasicAuth('BasicAuth')
export class UsersController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private userCreateUseCase: CreateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
  ) {}
  @Public()
  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const userId = await this.userCreateUseCase.execute(body);
    return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return await this.deleteUserUseCase.execute(id);
  }
}
