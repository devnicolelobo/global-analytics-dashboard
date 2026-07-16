import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  } as unknown as PrismaService;

  let service: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    service = new HealthService(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns status ok when the database ping succeeds', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Must not leak connection string / hostname.
    expect(JSON.stringify(result)).not.toContain('postgresql');
    expect(JSON.stringify(result)).not.toContain('localhost');
  });

  it('throws 503 when the database ping fails without leaking details', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(
      new Error('ECONNREFUSED postgresql://gad:secret@db:5432/x'),
    );

    let caught: unknown;
    try {
      await service.check();
    } catch (error: unknown) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ServiceUnavailableException);
    const body = (caught as ServiceUnavailableException).getResponse();
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(JSON.stringify(body)).not.toContain('postgresql');
    expect(JSON.stringify(body)).toContain('Database unreachable');
  });

  it('throws 503 when the database ping times out', async () => {
    jest.useFakeTimers();
    (prisma.$queryRaw as jest.Mock).mockImplementation(
      () => new Promise(() => undefined),
    );

    const pending = service.check();
    const expectation = expect(pending).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await jest.advanceTimersByTimeAsync(3_000);
    await expectation;
  });
});
