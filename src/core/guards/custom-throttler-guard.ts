import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Сначала проверяем лимит запросов
    const canActivate = await super.canActivate(context);

    // Если лимит превышен, сразу возвращаем 429
    if (!canActivate) {
      return false;
    }

    // Если лимит не превышен, пропускаем запрос дальше (к LocalAuthGuard)
    return true;
  }
}
