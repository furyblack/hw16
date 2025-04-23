import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../domain/post';
import {
  CreatePostForBlogInputDto,
  CreatePostDto,
  UpdatePostForMethod,
} from '../dto/create-post.dto';
import { PostsRepository } from '../infrastructure/posts-repository';
import { DeletionStatus } from '../../../user-accounts/domain/user.entity';
import { Blog, BlogModelType } from '../../blogs/domain/blog.entity';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '../../../../core/exceptions/domain-exceptions';
import {
  LikeStatusEnum,
  LikeStatusType,
  PostLike,
  PostLikeDocument,
} from '../likes/like-model';
import { Model } from 'mongoose';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private postModel: PostModelType,
    @InjectModel(PostLike.name) private postLikeModel: Model<PostLikeDocument>,
    private postRepository: PostsRepository,
    @InjectModel(Blog.name)
    private blogModel: BlogModelType,
  ) {}

  async createPost(dto: CreatePostDto): Promise<string> {
    const blog = await this.blogModel.findOne({
      _id: dto.blogId,
      deletionStatus: DeletionStatus.NotDeleted,
    });

    if (!blog) {
      throw BadRequestDomainException.create('blog not found', 'blogId');
    }

    const post = this.postModel.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
    });
    await this.postRepository.save(post);
    return post._id.toString();
  }

  async createPostForBlog(
    blogId: string,
    dto: CreatePostForBlogInputDto,
  ): Promise<string> {
    const blogExists = await this.blogModel.exists({
      _id: blogId,
      deletionStatus: DeletionStatus.NotDeleted,
    });

    if (!blogExists) {
      throw NotFoundDomainException.create('blog not found', 'blogId');
    }
    const blog = await this.blogModel.findOne({
      _id: blogId,
    });
    const post = this.postModel.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blogId,
      blogName: blog!.name,
    });
    await this.postRepository.save(post);
    return post._id.toString();
  }

  async deletePost(id: string) {
    const post = await this.postRepository.findOrNotFoundFail(id);
    post.makeDeleted();
    await this.postRepository.save(post);
  }
  async updatePost(id: string, dto: UpdatePostForMethod): Promise<string> {
    const post = await this.postRepository.findOrNotFoundFail(id);
    post.update(dto);
    await this.postRepository.save(post);
    return post._id.toString();
  }
  async updateLikeStatus(
    postId: string,
    userId: string,
    userLogin: string,
    likeStatus: LikeStatusType,
  ): Promise<void> {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException('post not found');
    }

    const existingLike = await this.postLikeModel.findOne({
      postId,
      userId,
    });

    if (likeStatus === 'None') {
      if (existingLike) {
        await existingLike.deleteOne();
      }
    } else {
      if (existingLike) {
        if (existingLike.status !== (likeStatus as LikeStatusEnum)) {
          existingLike.status = likeStatus as LikeStatusEnum;
          await existingLike.save();
        }
      } else {
        const newLike = new this.postLikeModel({
          postId,
          userId,
          login: userLogin,
          status: likeStatus as LikeStatusEnum,
        });
        console.log('Сохранение лайка:', newLike);
        await newLike.save();
      }
    }

    await this.updatePostLikeCounts(postId);
  }

  private async updatePostLikeCounts(postId: string): Promise<void> {
    const likesCount = await this.postLikeModel.countDocuments({
      postId,
      status: 'Like',
    });
    const dislikesCount = await this.postLikeModel.countDocuments({
      postId,
      status: 'Dislike',
    });

    const newestLikes = await this.postLikeModel
      .find({ postId, status: 'Like' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select(['userId', 'createdAt', 'login'])
      .exec();
    console.log('newestLikes:', newestLikes);

    const lastThreeLikes = newestLikes.map((like) => ({
      addedAt: like.createdAt,
      userId: like.userId,
      login: like.login,
    }));
    console.log('Обновляем пост с лайками:', {
      likesCount,
      dislikesCount,
      newestLikes: lastThreeLikes,
    });

    await this.postModel.findByIdAndUpdate(postId, {
      likesCount,
      dislikesCount,
      newestLikes: lastThreeLikes,
    });
  }
}
