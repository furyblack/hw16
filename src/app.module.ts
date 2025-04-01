import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAccountsModule } from './moduls/user-accounts/user-accounts.module';
import { TestingModule } from './moduls/testing/testing.module';
import { BloggerPlatformModule } from './moduls/bloggers-platform/bloggers-platform.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://localhost:27017/',
      //'mongodb+srv://miha:miha2016!@cluster0.expiegq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    ),
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
