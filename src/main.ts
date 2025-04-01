import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { DomainExceptionsFilter } from './core/exceptions/filters/domain-exceptions-filter';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app); //глобальные настройки приложения

  app.useGlobalFilters(new AllExceptionsFilter(), new DomainExceptionsFilter());
  const PORT = process.env.PORT || 3000; //TODO: move to configService. will be in the following lessons

  await app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
  });
}

bootstrap();
