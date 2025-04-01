import { Module } from '@nestjs/common';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { TestingController } from './testing.controller';
import { BloggerPlatformModule } from '../bloggers-platform/bloggers-platform.module';

@Module({
  imports: [UserAccountsModule, BloggerPlatformModule],
  controllers: [TestingController],
  providers: [],
  exports: [],
})
export class TestingModule {}
