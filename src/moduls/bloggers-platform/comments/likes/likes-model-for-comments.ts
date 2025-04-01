import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Comment } from '../domain/comment.entity';
import { LikeStatusEnum } from '../../posts/likes/like-model';

@Schema({ timestamps: true })
export class CommentLikeModel {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: true,
  })
  @Prop()
  commentId: Comment;

  @Prop({ required: true })
  userId: string;

  @Prop({ enum: LikeStatusEnum, required: true })
  status: LikeStatusEnum;

  @Prop()
  createdAt: Date;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLikeModel);
export type CommentLikeDocument = CommentLikeModel & Document;
