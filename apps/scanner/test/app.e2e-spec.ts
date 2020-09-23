import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { HeadlessModule } from '../src/headless/headless.module';
import { HeadlessController } from '../src/headless/headless.controller';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('to be defined', () => {
    const controller = app.select(HeadlessModule).get(HeadlessController);
    expect(controller).toBeDefined();
  });
});
