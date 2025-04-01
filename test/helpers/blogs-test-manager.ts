import { HttpStatus, INestApplication } from '@nestjs/common';
import { CreateBlogDomainDto } from '../../src/moduls/bloggers-platform/blogs/dto/create-user.domain.dto';
import request from 'supertest';
import { CreateBlogDto } from '../../src/moduls/bloggers-platform/blogs/dto/create-blog.dto';
import { BlogsViewDto } from '../../src/moduls/bloggers-platform/blogs/api/view-dto/blogs.view-dto';

export class BlogsTestManager {
  constructor(private app: INestApplication) {}

  private readonly BASIC_CREDENTIALS = {
    username: 'admin',
    password: 'qwerty',
  };

  async createBlog(
    createModel: CreateBlogDto,
    accessToken: string,
    expectedStatus: number = HttpStatus.CREATED,
  ): Promise<BlogsViewDto> {
    const response = await request(this.app.getHttpServer())
      .post('/api/blogs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createModel)
      .expect(expectedStatus);

    return response.body;
  }

  async createBlogUnauthorized(data: CreateBlogDomainDto) {
    return request(this.getHttpServer()).post('/api/blogs').send(data);
  }

  async createBlogWithInvalidAuth(data: CreateBlogDomainDto) {
    return request(this.getHttpServer())
      .post('/api/blogs')
      .auth('wrong', 'credentials', { type: 'basic' })
      .send(data);
  }

  private getHttpServer() {
    return this.app.getHttpServer();
  }
}
