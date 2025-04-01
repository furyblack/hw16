import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const deleteAllData = async (app: INestApplication) => {
  await request(app.getHttpServer())
    .delete('/api/testing/all-data')
    .expect(204);
};
