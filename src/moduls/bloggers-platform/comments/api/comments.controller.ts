import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommentsViewDto } from '../dto/comment-output-type';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { UpdateCommentDto } from '../dto/comment-input-dto';
import { CommentsService } from '../application/comments.service';
import { LikeToPostCreateModel } from '../../posts/likes/like-model';
import { CurrentUser } from '../../../user-accounts/decarators/user-decorators';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentQueryRepository: CommentsQueryRepository,
    private readonly commentsService: CommentsService,
  ) {}

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getComment(
    @Param('id') id: string,
    @CurrentUser() userId?: string,
  ): Promise<CommentsViewDto> {
    return this.commentQueryRepository.getCommentById(id, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Param('id') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() userId: string,
  ) {
    await this.commentsService.updateComment(
      commentId,
      updateCommentDto.content,
      userId,
    );
    return { message: 'Comment updated successfully' };
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() { likeStatus }: LikeToPostCreateModel,
    @CurrentUser() userId: string,
  ) {
    try {
      const commentExists = await this.commentsService.commentExists(id);
      if (!commentExists) {
        throw new NotFoundException({
          errorMessages: [{ message: 'Comment not found', field: 'commentId' }],
        });
      }

      await this.commentsService.updateLikeComment(id, userId, likeStatus);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Пробрасываем NotFoundException дальше
      }
      console.error('Error updating like status:', error);
      throw new InternalServerErrorException({ error: 'Something went wrong' });
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('id') commentId: string,
    @CurrentUser() userId: string,
  ) {
    await this.commentsService.deleteComment(commentId, userId);
    return { message: 'Comment deleted successfully' };
  }
}
