import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { ApiNinjasModule } from './integration/api-ninjas/api-ninjas.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // isGlobal: true — ConfigService available in every module without re-importing.
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    // Upstream HTTP client — consumed by ingest module in later cards.
    ApiNinjasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
