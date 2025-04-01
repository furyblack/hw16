import { initSettings } from './helpers/init-settings';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { PostsTestManager } from './helpers/posts-test-manager';
import { deleteAllData } from './helpers/delete-all-data';
import { CreatePostDto } from '../src/moduls/bloggers-platform/posts/dto/create-post.dto';
import { BlogsTestManager } from './helpers/blogs-test-manager';
import { AuthTestManager } from './helpers/auth-test-manager';
import { CreateBlogDto } from '../src/moduls/bloggers-platform/blogs/dto/create-blog.dto';
import request from 'supertest';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let blogsTestManager: BlogsTestManager;
  let postsTestManager: PostsTestManager;
  let authTestManager: AuthTestManager;
  let accessToken: string;
  let basicAuth: string;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    blogsTestManager = result.blogsTestManager;
    postsTestManager = result.postsTestManager;
    authTestManager = result.authTestManager;

    // Basic auth для админских операций
    basicAuth = 'Basic ' + Buffer.from('admin:qwerty').toString('base64');

    // Регистрируем и логиним тестового пользователя
    const testUser = {
      login: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!',
    };
    await authTestManager.registerUser(testUser, HttpStatus.NO_CONTENT);
    const loginResult = await authTestManager.login({
      loginOrEmail: testUser.login,
      password: testUser.password,
    });
    accessToken = loginResult.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('Posts CRUD operations', () => {
    let createdBlogId: string;
    let createdPostId: string;

    beforeEach(async () => {
      // Создаем блог перед тестами постов
      const blogData: CreateBlogDto = {
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test.com',
      };
      const blogResponse = await request(app.getHttpServer())
        .post('/api/blogs')
        .set('Authorization', basicAuth)
        .send(blogData)
        .expect(HttpStatus.CREATED);

      createdBlogId = blogResponse.body.id;

      // Создаем пост перед тестами
      const postData: CreatePostDto = {
        title: 'Test Post',
        shortDescription: 'Test Short Description',
        content: 'Test Content',
        blogId: createdBlogId,
      };
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', basicAuth)
        .send(postData)
        .expect(HttpStatus.CREATED);

      createdPostId = postResponse.body.id;
    });

    it('should create post (POST /posts)', async () => {
      const postData: CreatePostDto = {
        title: 'New Post',
        shortDescription: 'New Description',
        content: 'New Content',
        blogId: createdBlogId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', basicAuth)
        .send(postData)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        id: expect.any(String),
        title: postData.title,
        shortDescription: postData.shortDescription,
        content: postData.content,
        blogId: createdBlogId,
        blogName: 'Test Blog',
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });
    });

    it('should get post by id (GET /posts/:id)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        id: createdPostId,
        title: 'Test Post',
        shortDescription: 'Test Short Description',
        content: 'Test Content',
        blogId: createdBlogId,
        blogName: 'Test Blog',
        createdAt: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });
    });

    it('should update post (PUT /posts/:id)', async () => {
      const updateData = {
        title: 'Updated Post',
        shortDescription: 'Updated Description',
        content: 'Updated Content',
        blogId: createdBlogId,
      };

      await request(app.getHttpServer())
        .put(`/api/posts/${createdPostId}`)
        .set('Authorization', basicAuth)
        .send(updateData)
        .expect(HttpStatus.NO_CONTENT);

      // Проверяем обновление
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}`)
        .expect(HttpStatus.OK);

      expect(response.body.title).toBe(updateData.title);
    });

    it('should delete post (DELETE /posts/:id)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/posts/${createdPostId}`)
        .set('Authorization', basicAuth)
        .expect(HttpStatus.NO_CONTENT);

      // Проверяем что пост удален
      await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Posts likes operations', () => {
    let postId: string;

    beforeEach(async () => {
      // Создаем блог и пост для тестов лайков
      const blogData: CreateBlogDto = {
        name: 'Likes Test Blog',
        description: 'Description',
        websiteUrl: 'https://likes-test.com',
      };
      const blogResponse = await request(app.getHttpServer())
        .post('/api/blogs')
        .set('Authorization', basicAuth)
        .send(blogData)
        .expect(HttpStatus.CREATED);

      const postData: CreatePostDto = {
        title: 'Likes Test Post',
        shortDescription: 'Description',
        content: 'Content',
        blogId: blogResponse.body.id,
      };
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', basicAuth)
        .send(postData)
        .expect(HttpStatus.CREATED);

      postId = postResponse.body.id;
    });

    it('should like post (PUT /posts/:id/like-status)', async () => {
      await request(app.getHttpServer())
        .put(`/api/posts/${postId}/like-status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ likeStatus: 'Like' })
        .expect(HttpStatus.NO_CONTENT);

      // Проверяем что лайк добавился
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.extendedLikesInfo).toEqual({
        likesCount: 1,
        dislikesCount: 0,
        myStatus: 'Like',
        newestLikes: [
          {
            addedAt: expect.any(String),
            userId: expect.any(String),
            login: 'testuser',
          },
        ],
      });
    });
  });
});
