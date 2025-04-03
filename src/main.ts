import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { DomainExceptionsFilter } from './core/exceptions/filters/domain-exceptions-filter';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions-filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService); // получаем ConfigService

  appSetup(app);

  app.useGlobalFilters(new AllExceptionsFilter(), new DomainExceptionsFilter());

  // Получаем порт через ConfigService с fallback значением
  const PORT = configService.get<number>('PORT', 4005);

  await app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Current NODE_ENV: ${configService.get('NODE_ENV')}`);
  });
}

bootstrap();
