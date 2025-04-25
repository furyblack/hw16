import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomLocalAuthGuard extends AuthGuard('local') {
  handleRequest(err: any, user: any) {
    //не бросаем ошибку сразу, а возвращаем null
    //for fun
    if (err || !user) {
      return null; // ThrottlerGuard сможет посчитать запрос
    }
    return user;
  }
}
