import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { DeletionStatus } from '../../../user-accounts/domain/user.entity';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: BlogModelType) {}

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async findById(id: string): Promise<BlogDocument | null> {
    return this.blogModel.findOne({
      _id: id,
      deletionStatus: { $ne: DeletionStatus.PermanentDeleted },
    });
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.findById(id);
    if (!blog) {
      throw new NotFoundException('blog not found');
    }
    return blog;
  }
}
