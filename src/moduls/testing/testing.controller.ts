import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../user-accounts/domain/user.entity';
import {
  Blog,
  BlogModelType,
} from '../bloggers-platform/blogs/domain/blog.entity';
import { Post, PostModelType } from '../bloggers-platform/posts/domain/post';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    @InjectModel(Post.name)
    private PostModel: PostModelType,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    await Promise.all([
      this.UserModel.deleteMany(),
      this.BlogModel.deleteMany(),
      this.PostModel.deleteMany(),
    ]);
  }
}
