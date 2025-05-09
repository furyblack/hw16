import { INestApplication } from '@nestjs/common';
import { DomainExceptionsFilter } from '../core/exceptions/filters/domain-exceptions-filter';
import { AllExceptionsFilter } from '../core/exceptions/filters/all-exceptions-filter';

export function exceptionFilterSetup(app: INestApplication) {
  //Подключаем наши фильтры. Тут важна последовательность! (сработает справа на лево)
  app.useGlobalFilters(new DomainExceptionsFilter(), new AllExceptionsFilter());
}
