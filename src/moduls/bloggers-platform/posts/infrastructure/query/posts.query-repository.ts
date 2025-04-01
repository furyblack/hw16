import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post';
import { PostsViewDto } from '../../api/view-dto/posts.view-dto';
import { DeletionStatus } from '../../../../user-accounts/domain/user.entity';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery, Model } from 'mongoose';
import { Blog, BlogModelType } from '../../../blogs/domain/blog.entity';
import {
  LikeStatusType,
  PostLike,
  PostLikeDocument,
} from '../../likes/like-model';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private postModel: PostModelType,
    @InjectModel(Blog.name)
    private blogModel: BlogModelType,
    @InjectModel(PostLike.name)
    private postLikeModel: Model<PostLikeDocument>, // Исправляем тип
  ) {}

  async getByIdOrNotFoundFail(
    id: string,
    userId?: string,
  ): Promise<PostsViewDto> {
    const post = await this.postModel.findOne({
      _id: id,
      deletionStatus: { $ne: DeletionStatus.PermanentDeleted },
    });
    if (!post) {
      throw new NotFoundException('post not found');
    }

    let myStatus: LikeStatusType = 'None';

    if (userId) {
      const userLike = await this.postLikeModel.findOne({ postId: id, userId });
      if (userLike) {
        myStatus = userLike.status;
      }
    }

    return PostsViewDto.mapToView(post, myStatus);
  }

  async getAll(
    query: GetPostsQueryParams,
    userId?: string, // Добавляем userId как необязательный параметр
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    const filter: FilterQuery<Post> = {
      deletionStatus: DeletionStatus.NotDeleted,
    };
    if (query.searchTitleTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        title: { $regex: query.searchTitleTerm, $options: 'i' },
      });
    }

    const posts = await this.postModel
      .find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.postModel.countDocuments(filter);

    const items = await Promise.all(
      posts.map(async (p) => {
        let myStatus: LikeStatusType = 'None';
        if (userId) {
          const userLike = await this.postLikeModel.findOne({
            postId: p._id.toString(),
            userId,
          });
          if (userLike) {
            myStatus = userLike.status;
          }
        }
        return PostsViewDto.mapToView(p, myStatus);
      }),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getAllPostsForBlog(
    blogId: string,
    query: GetPostsQueryParams,
    userId?: string, // Добавляем userId как необязательный параметр
  ): Promise<PaginatedViewDto<PostsViewDto[]>> {
    const blogExists = await this.blogModel.exists({
      _id: blogId,
      deletionStatus: DeletionStatus.NotDeleted,
    });
    if (!blogExists) {
      throw new NotFoundException('Blog not found');
    }

    const filter: FilterQuery<Post> = {
      deletionStatus: DeletionStatus.NotDeleted,
      blogId: blogId,
    };

    if (query.searchTitleTerm) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        title: { $regex: query.searchTitleTerm, $options: 'i' },
      });
    }

    const posts = await this.postModel
      .find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.postModel.countDocuments(filter);

    const items = await Promise.all(
      posts.map(async (p) => {
        let myStatus: LikeStatusType = 'None';
        if (userId) {
          const userLike = await this.postLikeModel.findOne({
            postId: p._id.toString(),
            userId,
          });
          if (userLike) {
            myStatus = userLike.status;
          }
        }
        return PostsViewDto.mapToView(p, myStatus);
      }),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
