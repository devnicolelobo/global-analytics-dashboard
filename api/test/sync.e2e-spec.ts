import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SyncStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { SyncAlreadyRunningException } from './../src/common/errors';
import { ErrorResponseDto } from './../src/common/errors/error-response.dto';
import { configureApp } from './../src/configure-app';
import { AppModule } from './../src/app.module';
import { IngestService } from './../src/ingest/ingest.service';
import { PrismaService } from './../src/prisma/prisma.service';

const VALID_CUID = 'clx9abc123def456ghi789012';

describe('Sync endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let runSync: jest.Mock;
  let findUnique: jest.Mock;

  beforeEach(async () => {
    process.env.DATABASE_URL =
      'postgresql://gad:gad@localhost:5432/global_analytics';

    runSync = jest.fn().mockResolvedValue({
      syncRunId: VALID_CUID,
      status: 'running',
      startedAt: new Date('2026-07-08T18:30:00.000Z'),
      mode: 'snapshot',
    });

    findUnique = jest.fn();

    const prismaMock = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      syncRun: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique,
        create: jest.fn(),
        update: jest.fn(),
      },
      covidDailyMetric: {
        aggregate: jest.fn().mockResolvedValue({
          _max: { referenceDate: null },
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(IngestService)
      .useValue({ runSync, runSyncBlocking: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /sync → 202 with accepted body shape', async () => {
    const response = await request(app.getHttpServer())
      .post('/sync')
      .send({ mode: 'snapshot' })
      .expect(202);

    expect(response.body).toEqual({
      syncRunId: VALID_CUID,
      status: 'running',
      startedAt: '2026-07-08T18:30:00.000Z',
      mode: 'snapshot',
    });
    expect(runSync).toHaveBeenCalledWith('snapshot');
  });

  it('POST /sync concurrent → 409 envelope', async () => {
    runSync.mockRejectedValueOnce(new SyncAlreadyRunningException());

    const response = await request(app.getHttpServer())
      .post('/sync')
      .send({})
      .expect(409);
    const body = response.body as ErrorResponseDto;

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 409,
        error: 'Conflict',
        message: 'A sync is already running',
        path: '/sync',
      }),
    );
    expect(body).not.toHaveProperty('stack');
  });

  it('POST /sync invalid mode → 400 envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/sync')
      .send({ mode: 'invalid' })
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.path).toBe('/sync');
    expect(body).not.toHaveProperty('stack');
    expect(runSync).not.toHaveBeenCalled();
  });

  it('GET /sync/runs/:id malformed → 400 envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/sync/runs/!!invalid!!')
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
    expect(body.path).toBe('/sync/runs/!!invalid!!');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('GET /sync/runs/:id missing → 404 envelope', async () => {
    findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(`/sync/runs/${VALID_CUID}`)
      .expect(404);
    const body = response.body as ErrorResponseDto;

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        path: `/sync/runs/${VALID_CUID}`,
      }),
    );
    expect(body).not.toHaveProperty('stack');
  });

  it('GET /sync/runs/:id → 200 SyncRun detail', async () => {
    findUnique.mockResolvedValue({
      id: VALID_CUID,
      startedAt: new Date('2026-07-08T18:30:00.000Z'),
      completedAt: null,
      status: SyncStatus.running,
      source: 'api-ninjas',
      mode: 'full',
      recordsUpserted: 0,
      errorMessage: null,
      metadata: null,
    });

    const response = await request(app.getHttpServer())
      .get(`/sync/runs/${VALID_CUID}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: VALID_CUID,
        status: 'running',
        mode: 'full',
        source: 'api-ninjas',
      }),
    );
  });

  it('GET /sync/status → 200 SyncStatusDto shape', async () => {
    const response = await request(app.getHttpServer())
      .get('/sync/status')
      .expect(200);

    expect(response.body).toEqual({
      lastSuccessfulSyncAt: null,
      lastSyncStatus: null,
      dataSource: 'api-ninjas',
      latestReferenceDate: null,
    });
  });
});
