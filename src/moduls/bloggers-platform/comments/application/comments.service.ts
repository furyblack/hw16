import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommentsRepository } from '../infrastructure/comments-repository';
import { Comment, CommentModelType } from '../domain/comment.entity';
import { CommentInputDto } from '../dto/comment-input-dto';
import { InjectModel } from '@nestjs/mongoose';
import { CommentsViewDto } from '../dto/comment-output-type';
import { NotFoundDomainException } from '../../../../core/exceptions/domain-exceptions';
import { LikeStatusEnum, LikeStatusType } from '../../posts/likes/like-model';
import {
  CommentLikeDocument,
  CommentLikeModel,
} from '../likes/likes-model-for-comments';
import { Model } from 'mongoose';
import { Post, PostModelType } from '../../posts/domain/post';
import { DeletionStatus } from '../../../user-accounts/domain/user.entity';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentsRepository: CommentsRepository,
    @InjectModel(Comment.name) private commentModel: CommentModelType,
    @InjectModel(CommentLikeModel.name)
    private commentLikeDocumentModel: Model<CommentLikeDocument>,
    @InjectModel(Post.name)
    private postModel: PostModelType,
  ) {}

  async createComment(
    postId: string,
    userId: string,
    userLogin: string,
    dto: CommentInputDto,
  ): Promise<CommentsViewDto> {
    // Проверяем, существует ли пост
    const postExists = await this.postModel.exists({
      _id: postId,
      deletionStatus: DeletionStatus.NotDeleted,
    });
    if (!postExists) {
      throw new NotFoundException('Post not found');
    }
    const comment = this.commentModel.createInstance(
      dto.content,
      postId,
      userId,
      userLogin,
    );
    await this.commentsRepository.save(comment);
    const myStatus: LikeStatusType = 'None';
    return CommentsViewDto.mapToView(comment, myStatus);
  }

  async updateComment(
    commentId: string,
    content: string,
    userId: string,
  ): Promise<void> {
    try {
      // Ищем комментарий по ID
      const comment = await this.commentModel.findOne({
        _id: commentId,
      });

      // Если комментарий не найден
      if (!comment) {
        throw NotFoundDomainException.create('Comment not found', 'comment');
      }

      // Если комментарий найден, но не принадлежит пользователю
      if (comment.commentatorInfo.userId !== userId) {
        throw new ForbiddenException(
          'You are not allowed to update this comment',
        );
      }

      // Обновляем содержимое комментария
      comment.content = content;
      await comment.save();
    } catch (error) {
      // Логируем ошибку, если это необходимо
      this.logger.error(`Error updating comment: ${error.message}`);
      throw error;
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      // Ищем комментарий по ID
      const comment = await this.commentModel.findOne({
        _id: commentId,
      });

      // Если комментарий не найден
      if (!comment) {
        throw NotFoundDomainException.create('Comment not found', 'comment');
      }

      // Если комментарий найден, но не принадлежит пользователю
      if (comment.commentatorInfo.userId !== userId) {
        throw new ForbiddenException(
          'You are not allowed to delete this comment',
        );
      }

      await comment.deleteOne();
    } catch (error) {
      this.logger.error(`Error deleting comment: ${error.message}`);
      throw error;
    }
  }

  async commentExists(commentId: string): Promise<boolean> {
    const comment = await this.commentModel.findById(commentId).exec();
    return !!comment;
  }

  async updateLikeComment(
    commentId: string,
    userId: string,
    likeStatus: LikeStatusType,
  ): Promise<void> {
    const existingLike = await this.commentLikeDocumentModel.findOne({
      commentId,
      userId,
    });

    if (likeStatus === LikeStatusEnum.NONE) {
      if (existingLike) {
        await existingLike.deleteOne();
      }
    } else {
      if (existingLike) {
        if (existingLike.status !== likeStatus) {
          existingLike.status = likeStatus as LikeStatusEnum;
          await existingLike.save();
        }
      } else {
        const newLike = new this.commentLikeDocumentModel({
          commentId,
          userId,
          status: likeStatus as LikeStatusEnum,
        });
        await newLike.save();
      }
    }

    await this.updateCommentLikeCounts(commentId);
  }

  private async updateCommentLikeCounts(commentId: string): Promise<void> {
    const likesCount = await this.commentLikeDocumentModel.countDocuments({
      commentId,
      status: LikeStatusEnum.LIKE,
    });
    const dislikesCount = await this.commentLikeDocumentModel.countDocuments({
      commentId,
      status: LikeStatusEnum.DISLIKE,
    });

    await this.commentModel.findByIdAndUpdate(commentId, {
      'likesInfo.likesCount': likesCount,
      'likesInfo.dislikesCount': dislikesCount,
    });
  }
}
