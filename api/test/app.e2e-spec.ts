import {
  Body,
  Controller,
  Get,
  INestApplication,
  InternalServerErrorException,
  Module,
  Post,
} from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import { ErrorResponseDto } from './../src/common/errors/error-response.dto';
import { createPrismaMock, createTestApp } from './helpers';

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

@Controller('__boom_probe')
class BoomProbeController {
  @Get()
  boom(): never {
    throw new InternalServerErrorException(
      'postgresql://gad:secret@localhost:5432/global_analytics API_NINJAS_KEY=leak',
    );
  }
}

@Module({
  controllers: [ValidationProbeController, BoomProbeController],
})
class ProbeModule {}

describe('API foundation (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const boot = await createTestApp({
      imports: [ProbeModule],
      prisma: prismaMock,
    });
    app = boot.app;
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
    expect(JSON.stringify(body)).not.toContain('DATABASE');
  });

  it('GET /health → 503 envelope when DB is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValue(
      new Error('ECONNREFUSED postgresql://gad:secret@localhost:5432/db'),
    );

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
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(JSON.stringify(body)).not.toContain('postgresql');
    expect(body).not.toHaveProperty('stack');
  });

  it('GET /unknown → full 404 envelope without stack', async () => {
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

  it('non-whitelisted field → 400 envelope (forbidNonWhitelisted)', async () => {
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

  it('empty body / missing name → 400 envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/__validation_probe')
      .send({})
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(typeof body.message).toBe('string');
    expect(body).not.toHaveProperty('stack');
  });

  it('invalid name (not a string) → 400 envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/__validation_probe')
      .send({ name: 123 })
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
    expect(body.path).toBe('/__validation_probe');
    expect(body).not.toHaveProperty('stack');
  });

  it('valid probe payload → 201/200 without error', async () => {
    const response = await request(app.getHttpServer())
      .post('/__validation_probe')
      .send({ name: 'ok' })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(response.body).toEqual({ name: 'ok' });
  });
});

describe('API foundation — production error envelope (REQ-F-13)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const boot = await createTestApp({
      imports: [ProbeModule],
      prisma: createPrismaMock(),
      nodeEnv: 'production',
    });
    app = boot.app;
  });

  afterEach(async () => {
    await app.close();
  });

  it('500 body has no stack, DATABASE_URL, or API key (NODE_ENV=production)', async () => {
    const response = await request(app.getHttpServer())
      .get('/__boom_probe')
      .expect(500);
    const body = response.body as ErrorResponseDto;
    const raw = JSON.stringify(body);

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
        path: '/__boom_probe',
      }),
    );
    expect(body).not.toHaveProperty('stack');
    expect(raw).not.toContain('secret');
    expect(raw).not.toContain('postgresql');
    expect(raw).not.toContain('API_NINJAS_KEY');
    expect(raw).not.toContain('leak');
  });
});
