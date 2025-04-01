import { IsEmail, IsString, Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../domain/user.entity';

import { Trim } from '../../../../core/decorators/transform/trim';

export class CreateUserInputDto {
  @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
  // @LoginIsExist()
  login: string;

  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  @Trim()
  password: string;

  @IsString()
  @IsEmail()
  // @Matches(emailConstraints.match)
  @Trim()
  email: string;
}
