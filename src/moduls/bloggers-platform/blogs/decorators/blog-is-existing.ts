import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BlogsRepository } from '../infrastructure/blogs-repository';

export function BlogIsExist(
  property?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: BlogIsExistConstraint,
    });
  };
}

//регистрация в ioc обязательна
@ValidatorConstraint({ name: 'BlogIsExist', async: true })
@Injectable()
export class BlogIsExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly blogRepository: BlogsRepository) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    console.log('validator ');
    const blog = await this.blogRepository.findById(value);
    return !!blog;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'blog is not exist';
  }
}
