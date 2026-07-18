import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Infrastructure-only wrapper — business logic belongs in domain services.
// Single instance per Node process (Nest singleton) for connection pool efficiency.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    // Fail-fast: surface DB connectivity issues at startup, not on first request.
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
