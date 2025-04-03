import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
export const configModule = ConfigModule.forRoot({
  envFilePath: [
    join(__dirname, `env`, `.env.${process.env.NODE_ENV}.local`), // .env.development.local (приоритет 1)
    join(__dirname, `env`, `.env.${process.env.NODE_ENV}`), // .env.development (приоритет 2)
    join(__dirname, `env`, '.env.production'),
  ],
  isGlobal: true,
});
