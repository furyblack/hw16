import { initSettings } from './helpers/init-settings';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateBlogDomainDto } from '../src/moduls/bloggers-platform/blogs/dto/create-user.domain.dto';

describe('BlogsController (e2e)', () => {
  let app: INestApplication;
  let createdBlogId: string;

  beforeAll(async () => {
    const settings = await initSettings();
    app = settings.app;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/blogs', () => {
    const validBlogData: CreateBlogDomainDto = {
      name: 'Valid Blog Name',
      description: 'Valid description with more than 10 characters',
      websiteUrl: 'https://valid-url.com',
    };

    it('should create blog successfully with valid data and auth', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/blogs')
        .auth('admin', 'qwerty')
        .send(validBlogData)
        .expect(HttpStatus.CREATED);

      createdBlogId = response.body.id; // Сохраняем ID созданного блога для других тестов

      expect(response.body).toEqual({
        id: expect.any(String),
        name: validBlogData.name,
        description: validBlogData.description,
        websiteUrl: validBlogData.websiteUrl,
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });
    });
  });

  describe('GET /api/blogs/:id', () => {
    it('should return blog by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/blogs/${createdBlogId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        id: createdBlogId,
        name: expect.any(String),
        description: expect.any(String),
        websiteUrl: expect.any(String),
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });
    });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = '65d1151b5c5d10a4b5a28f9a'; // Пример несуществующего ID
      await request(app.getHttpServer())
        .get(`/api/blogs/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PUT /api/blogs/:id', () => {
    let blogId: string;

    beforeAll(async () => {
      // Создаем блог один раз перед всеми тестами
      const response = await request(app.getHttpServer())
        .post('/api/blogs')
        .auth('admin', 'qwerty')
        .send({
          name: 'Initial Name',
          description: 'Initial description long enough',
          websiteUrl: 'https://initial-url.com',
        });
      blogId = response.body.id;
    });

    it('should update blog with valid data', async () => {
      const validData = {
        name: 'New Valid Name',
        description: 'New valid description with proper length',
        websiteUrl: 'https://new-valid-url.com',
      };

      await request(app.getHttpServer())
        .put(`/api/blogs/${blogId}`)
        .auth('admin', 'qwerty')
        .send(validData)
        .expect(HttpStatus.NO_CONTENT);

      // Verify update
      const { body } = await request(app.getHttpServer())
        .get(`/api/blogs/${blogId}`)
        .expect(HttpStatus.OK);

      expect(body.name).toBe(validData.name);
      expect(body.description).toBe(validData.description);
      expect(body.websiteUrl).toBe(validData.websiteUrl);
    });

    // it('should return 400 for invalid data', async () => {
    //   const invalidData = {
    //     name: 'A', // Too short
    //     description: 'New desc',
    //     websiteUrl: 'invalid-url',
    //   };
    //
    //   const response = await request(app.getHttpServer())
    //     .put(`/api/blogs/${blogId}`)
    //     .auth('admin', 'qwerty')
    //     .send(invalidData);
    //
    //   console.log('Invalid data response:', {
    //     status: response.status,
    //     body: response.body,
    //   });
    //
    //   expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    //   expect(response.body).toHaveProperty('errorsMessages');
    // });
  });

  describe('DELETE /api/blogs/:id', () => {
    it('should delete blog successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/api/blogs/${createdBlogId}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NO_CONTENT);

      // Проверяем, что блог действительно удален
      await request(app.getHttpServer())
        .get(`/api/blogs/${createdBlogId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    // it('should return 401 without auth', async () => {
    //   await request(app.getHttpServer())
    //     .delete(`/api/blogs/${createdBlogId}`)
    //     .expect(HttpStatus.UNAUTHORIZED);
    // });

    it('should return 404 for non-existent blog', async () => {
      const nonExistentId = '65d1151b5c5d10a4b5a28f9a';
      await request(app.getHttpServer())
        .delete(`/api/blogs/${nonExistentId}`)
        .auth('admin', 'qwerty')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/blogs', () => {
    it('should return blogs with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/blogs')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            websiteUrl: expect.any(String),
            createdAt: expect.any(String),
            isMembership: expect.any(Boolean),
          }),
        ]),
      });
    });
  });
});
