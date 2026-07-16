import {
  Body,
  Controller,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from './../src/common/errors/error-response.dto';
import { configureApp } from './../src/configure-app';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

/** Test-only DTO — exercises global ValidationPipe without a production route. */
class ProbeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

@Controller('__validation_probe')
class ValidationProbeController {
  @Post()
  probe(@Body() body: ProbeDto): ProbeDto {
    return body;
  }
}

@Module({
  controllers: [ValidationProbeController],
})
class ValidationProbeModule {}

describe('API foundation (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: {
    onModuleInit: jest.Mock;
    onModuleDestroy: jest.Mock;
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    process.env.DATABASE_URL =
      'postgresql://gad:gad@localhost:5432/global_analytics';

    prismaMock = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ValidationProbeModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health → 200 with status and timestamp when DB is up', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const body = response.body as { status: string; timestamp: string };

    expect(body).toEqual(
      expect.objectContaining({
        status: 'ok',
      }),
    );
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(JSON.stringify(body)).not.toContain('localhost');
  });

  it('GET /health → 503 envelope when DB is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('ECONNREFUSED'));

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(503);
    const body = response.body as ErrorResponseDto;

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Database unreachable',
        path: '/health',
      }),
    );
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('GET /unknown → 404 envelope fields present', async () => {
    const response = await request(app.getHttpServer())
      .get('/nonexistent')
      .expect(404);
    const body = response.body as ErrorResponseDto;

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        path: '/nonexistent',
      }),
    );
    expect(typeof body.message).toBe('string');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body).not.toHaveProperty('stack');
  });

  it('validation error → 400 envelope shape', async () => {
    const response = await request(app.getHttpServer())
      .post('/__validation_probe')
      .send({ unexpected: true })
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        path: '/__validation_probe',
      }),
    );
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
    expect(body).not.toHaveProperty('stack');
  });
});
