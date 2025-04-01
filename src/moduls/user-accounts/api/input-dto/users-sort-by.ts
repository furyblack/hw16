import { Types } from 'mongoose';
import { IsMongoId } from 'class-validator';

export enum UsersSortBy {
  CreatedAt = 'createdAt',
  Login = 'login',
  Email = 'email',
}

export class IdInputDTO {
  @IsMongoId()
  id: Types.ObjectId;
}
