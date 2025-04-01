import { CommentDocument } from '../domain/comment.entity';
import { LikeStatusType } from '../../posts/likes/like-model';

export class CommentsViewDto {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: Date;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatusType;
  };

  static mapToView(
    comment: CommentDocument,
    myStatus: LikeStatusType,
  ): CommentsViewDto {
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo?.likesCount || 0,
        dislikesCount: comment.likesInfo?.dislikesCount || 0,
        myStatus,
      },
    };
  }
}
