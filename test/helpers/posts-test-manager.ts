import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreatePostDto } from '../../src/moduls/bloggers-platform/posts/dto/create-post.dto';
import { PostsViewDto } from '../../src/moduls/bloggers-platform/posts/api/view-dto/posts.view-dto';
import { UpdatePostDto } from '../../src/moduls/bloggers-platform/posts/dto/create-post.dto';

export class PostsTestManager {
  constructor(private readonly app: INestApplication) {}

  async createPost(
    createModel: CreatePostDto,
    accessToken: string,
    expectedStatus: number = HttpStatus.CREATED,
  ): Promise<PostsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post('/api/posts')
      .set('Authorization', accessToken)
      .send(createModel)
      .expect(expectedStatus);

    return response.body;
  }

  async updatePost(
    postId: string,
    updateData: UpdatePostDto,
    accessToken: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/api/posts/${postId}`)
      .set('Authorization', accessToken)
      .send(updateData)
      .expect(expectedStatus);
  }

  async deletePost(
    postId: string,
    accessToken: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/api/posts/${postId}`)
      .set('Authorization', accessToken)
      .expect(expectedStatus);
  }

  async getPostById(
    postId: string,
    accessToken?: string,
    expectedStatus: number = HttpStatus.OK,
  ): Promise<PostsViewDto> {
    const requestBuilder = request(this.app.getHttpServer()).get(
      `/api/posts/${postId}`,
    );

    if (accessToken) {
      requestBuilder.set('Authorization', accessToken);
    }

    const response = await requestBuilder.expect(expectedStatus);
    return response.body;
  }

  async likePost(
    postId: string,
    likeStatus: 'Like' | 'Dislike' | 'None',
    accessToken: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .put(`/api/posts/${postId}/like-status`)
      .set('Authorization', accessToken)
      .send({ likeStatus })
      .expect(expectedStatus);
  }
}
