import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IpRestrictionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Здесь можно добавить проверку IP по черному списку
    // Например, если IP в черном списке - возвращаем 403
    next();
  }
}
