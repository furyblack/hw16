import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../domain/comment.entity';
import { DeletionStatus } from '../../../user-accounts/domain/user.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: CommentModelType,
  ) {}

  async save(comment: CommentDocument) {
    await comment.save();
  }

  async findById(id: string): Promise<CommentDocument | null> {
    return this.commentModel.findOne({
      _id: id,
      deletionStatus: { $ne: DeletionStatus.PermanentDeleted },
    });
  }

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async findByPostId(postId: string): Promise<CommentDocument[]> {
    return this.commentModel.find({
      postId,
      deletionStatus: DeletionStatus.NotDeleted,
    });
  }
}
