import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorExtension } from '../domain-exceptions';

export type HttpResponseBody = {
  errorsMessages: { message: string; field: string }[];
};

export abstract class BaseExceptionFilter implements ExceptionFilter {
  abstract onCatch(exception: any, response: Response, request: Request): void;

  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    this.onCatch(exception, response, request);
  }

  getDefaultHttpBody(url: string, exception: unknown): HttpResponseBody {
    const extensions = (exception as any).extensions || [];

    return {
      errorsMessages: extensions.map((ext: ErrorExtension) => ({
        message: ext.message,
        field: ext.key || 'unknown',
      })),
    };
  }
}
