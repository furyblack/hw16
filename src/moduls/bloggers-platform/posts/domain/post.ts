import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DeletionStatus } from '../../../user-accounts/domain/user.entity';
import {
  CreatePostForBlogInputDto,
  CreatePostInputDto,
} from '../dto/create-post.dto';
import { HydratedDocument, Model } from 'mongoose';

type newestLikes = {
  addedAt: string;
  userId: string;
  login: string;
};
@Schema({ timestamps: true })
export class Post {
  @Prop()
  title: string;
  @Prop()
  content: string;
  @Prop()
  blogId: string;
  @Prop()
  blogName: string;
  @Prop()
  shortDescription: string;
  createdAt: Date;
  @Prop({ default: 0 })
  likesCount: number;
  @Prop({ default: 0 })
  dislikesCount: number;
  @Prop({ type: Array, default: [] })
  newestLikes: newestLikes[];
  @Prop({ enum: DeletionStatus, default: DeletionStatus.NotDeleted })
  deletionStatus: DeletionStatus;

  static createInstance(
    dto: CreatePostInputDto & { blogName: string },
  ): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.shortDescription = dto.shortDescription;
    post.createdAt = new Date();
    post.likesCount = 0;
    post.dislikesCount = 0;
    post.newestLikes = [];
    post.deletionStatus = DeletionStatus.NotDeleted;
    return post as PostDocument;
  }
  makeDeleted() {
    if (this.deletionStatus !== DeletionStatus.NotDeleted) {
      throw new Error('Entity already deleted');
    }
    this.deletionStatus = DeletionStatus.PermanentDeleted;
  }
  update(dto: CreatePostForBlogInputDto) {
    this.title = dto.title;
    this.content = dto.content;
    this.shortDescription = dto.shortDescription;
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
