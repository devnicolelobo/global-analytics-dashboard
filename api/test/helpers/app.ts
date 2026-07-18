import { INestApplication, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import {
  COVID_UPSTREAM_CLIENT,
  type CovidUpstreamClient,
} from '../../src/integration/api-ninjas/covid-upstream.client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ensureTestEnv } from './env';

export type CreateTestAppOptions = {
  /** Extra Nest modules (e.g. validation probe controller). */
  imports?: Type<unknown>[];
  /**
   * When set, replaces PrismaService (HTTP-shape e2e without a live DB).
   * Omit to use the real Prisma client against PostgreSQL (integration).
   */
  prisma?: unknown;
  /**
   * Mock upstream so ingest/sync never hits API Ninjas (CI-safe).
   * Always pass this for suites that exercise IngestService / POST /sync.
   */
  upstream?: Partial<CovidUpstreamClient>;
  /**
   * Forces NODE_ENV (e.g. `production`) for REQ-F-13 envelope tests.
   * Unlike other env defaults, this overrides an already-set NODE_ENV.
   */
  nodeEnv?: string;
};

/**
 * Boot a full Nest app with the same ValidationPipe + HttpExceptionFilter
 * as production (`configureApp`).
 *
 * Nest best practice: override providers at the testing-module boundary
 * instead of branching production code for tests.
 */
export async function createTestApp(
  options: CreateTestAppOptions = {},
): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
}> {
  ensureTestEnv({ nodeEnv: options.nodeEnv });

  let builder = Test.createTestingModule({
    imports: [AppModule, ...(options.imports ?? [])],
  });

  if (options.prisma !== undefined) {
    builder = builder.overrideProvider(PrismaService).useValue(options.prisma);
  }

  if (options.upstream) {
    // Default empty upstream — critical: no accidental live network I/O.
    const upstream: CovidUpstreamClient = {
      fetchByCountry: jest.fn().mockResolvedValue([]),
      fetchByDate: jest.fn().mockResolvedValue([]),
      ...options.upstream,
    };
    builder = builder
      .overrideProvider(COVID_UPSTREAM_CLIENT)
      .useValue(upstream);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return { app, moduleRef };
}

/**
 * Minimal Prisma stand-in for suites that only need AppModule to boot.
 * Includes $connect/$disconnect so lifecycle hooks do not throw.
 */
export function createPrismaMock(overrides?: { queryRaw?: jest.Mock }): {
  onModuleInit: jest.Mock;
  onModuleDestroy: jest.Mock;
  $queryRaw: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
} {
  return {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw:
      overrides?.queryRaw ?? jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };
}
