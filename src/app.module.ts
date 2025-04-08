import { configModule } from './config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './moduls/user-accounts/user-accounts.module';
import { TestingModule } from './moduls/testing/testing.module';
import { BloggerPlatformModule } from './moduls/bloggers-platform/bloggers-platform.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    configModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/test',
        ),
      }),
      inject: [ConfigService],
    }),
    UserAccountsModule,
    TestingModule,
    BloggerPlatformModule,
    CoreModule,
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
