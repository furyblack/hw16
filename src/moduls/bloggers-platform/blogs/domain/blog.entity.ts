import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateBlogDomainDto } from '../dto/create-user.domain.dto';
import { HydratedDocument, Model } from 'mongoose';
import { DeletionStatus } from '../../../user-accounts/domain/user.entity';
import { UpdateBlogDto } from '../dto/create-blog.dto';

@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: String, required: true })
  name: string;
  @Prop({ type: String, required: true })
  description: string;
  @Prop({ type: String, required: true })
  websiteUrl: string;
  @Prop({ type: Boolean, required: true })
  isMembership: boolean;

  createdAt: Date;

  @Prop({ enum: DeletionStatus, default: DeletionStatus.NotDeleted })
  deletionStatus: DeletionStatus;

  static createInstance(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.createdAt = new Date();
    blog.isMembership = false;
    return blog as BlogDocument;
  }

  makeDeleted() {
    if (this.deletionStatus !== DeletionStatus.NotDeleted) {
      throw new Error('Entity already deleted');
    }
    this.deletionStatus = DeletionStatus.PermanentDeleted;
  }
  update(dto: UpdateBlogDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<BlogDocument> & typeof Blog;
