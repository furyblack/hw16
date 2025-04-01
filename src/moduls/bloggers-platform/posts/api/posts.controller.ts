import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePostInputDto, UpdatePostDto } from '../dto/create-post.dto';
import { PostsViewDto } from './view-dto/posts.view-dto';
import { PostsService } from '../application/posts.service';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { ApiBasicAuth } from '@nestjs/swagger';
import { CommentInputDto } from '../../comments/dto/comment-input-dto';
import { CurrentUser } from '../../../user-accounts/decarators/user-decorators';
import { CommentsService } from '../../comments/application/comments.service';
import { CommentsViewDto } from '../../comments/dto/comment-output-type';
import { JwtAuthGuard } from '../../../user-accounts/guards/bearer/jwt-auth.guard';
import { GetCommentsQueryParams } from '../../comments/dto/get-comments-query-params.input-dto';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import { LikeToPostCreateModel } from '../likes/like-model';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private postQueryRepository: PostsQueryRepository,
    private postService: PostsService,
    private commentService: CommentsService,
    private commentsService: CommentsService,
    private commentQueryRepository: CommentsQueryRepository,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth('BasicAuth')
  async createPost(@Body() body: CreatePostInputDto): Promise<PostsViewDto> {
    const postId = await this.postService.createPost(body);
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') postId: string,
    @Body() dto: CommentInputDto,
    @CurrentUser() userId: string,
    @CurrentUser('login') userLogin: string,
  ): Promise<CommentsViewDto> {
    return this.commentsService.createComment(postId, userId, userLogin, dto);
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async getAll(
    @Query() query: GetPostsQueryParams,
    @CurrentUser() userId?: string,
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    return this.postQueryRepository.getAll(query, userId);
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async getById(
    @Param('id') id: string,
    @CurrentUser() userId?: string,
  ): Promise<PostsViewDto> {
    console.log('log userid from get post by id', id, userId);
    return this.postQueryRepository.getByIdOrNotFoundFail(id, userId);
  }

  @Get(':id/comments')
  @UseGuards(JwtOptionalAuthGuard)
  async getCommentForPost(
    @Param('id') postId: string,
    @Query() query: GetCommentsQueryParams,
    @CurrentUser() userId?: string,
  ): Promise<PaginatedViewDto<CommentsViewDto[]>> {
    return this.commentQueryRepository.getCommentsForPost(
      postId,
      query,
      userId,
    );
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth('BasicAuth')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.postService.deletePost(id);
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth('BasicAuth')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: string,
    @Body()
    body: UpdatePostDto,
  ): Promise<PostsViewDto> {
    console.log('123123123123');
    const postId = await this.postService.updatePost(id, body);
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id/like-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async createLikeToPost(
    @Param('id') postId: string,
    @Body() { likeStatus }: LikeToPostCreateModel,
    @CurrentUser() userId: string,
    @CurrentUser('login') userLogin: string,
  ): Promise<void> {
    await this.postService.updateLikeStatus(
      postId,
      userId,
      userLogin,
      likeStatus,
    );
  }
}
