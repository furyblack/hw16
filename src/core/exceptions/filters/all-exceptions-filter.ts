//Все ошибки
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from './base-exception-filter';
import { Request, Response } from 'express';
import { DomainException } from '../domain-exceptions';
import { DomainExceptionsFilter } from './domain-exceptions-filter';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  onCatch(exception: unknown, response: Response, request: Request): void {
    console.error(exception);
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (exception instanceof DomainException) {
      // Если исключение - это `DomainException`, берем HTTP-код из `DomainExceptionsFilter`
      status = new DomainExceptionsFilter().calculateHttpCode(exception);
    }

    //TODO: Replace with getter from configService. will be in the following lessons
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      response.status(status).json({
        ...this.getDefaultHttpBody(request.url, exception),
        path: null,
        message: 'Some error occurred',
      });

      return;
    }

    response
      .status(status)
      .json(this.getDefaultHttpBody(request.url, exception));
  }
}
