import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { LikeStatus } from './decorators/like-status-decorator';
import { Post } from '../domain/post';

export class LikeToPostCreateModel {
  @LikeStatus()
  likeStatus: LikeStatusType;
}

export type LikeStatusType = 'None' | 'Like' | 'Dislike';

export enum LikeStatusEnum {
  LIKE = 'Like',
  DISLIKE = 'Dislike',
  NONE = 'None',
}

@Schema({ timestamps: true })
export class PostLike {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Post', required: true })
  postId: Post;

  @Prop({ required: true })
  userId: string;

  @Prop({ enum: LikeStatusEnum, required: true })
  status: LikeStatusEnum;

  @Prop({ required: true })
  login: string;
  @Prop()
  createdAt: Date;
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike);

export type PostLikeDocument = PostLike & Document;
