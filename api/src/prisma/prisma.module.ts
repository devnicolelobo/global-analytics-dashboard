import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() — feature modules (ingest, covid) inject PrismaService without re-importing.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
