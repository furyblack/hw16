import { ConfigModule } from '@nestjs/config';

export const configModule = ConfigModule.forRoot({
  envFilePath: [
    `.env.${process.env.NODE_ENV}.local`, // .env.development.local (приоритет 1)
    `.env.${process.env.NODE_ENV}`, // .env.development (приоритет 2)
    '.env',
  ],
  isGlobal: true,
});
