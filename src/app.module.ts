import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { GetMetricsUseCase } from '@application/use-cases/get-metrics.usecase';
import { GetProfileUseCase } from '@application/use-cases/get-profile.usecase';
import { GitHubHttpAdapter } from '@adapters/github.adapter';
import { MemoryCacheAdapter } from '@adapters/memory.adapter';
import { ProfilesController } from '@controllers/profiles.controller';
import { MetricsController } from '@controllers/metrics.controller';
import { HealthController } from '@controllers/health.controller';
import { GITHUB_PORT } from '@domain/ports/github.port';
import { CACHE_PORT } from '@domain/ports/cache.port';
import { LoggingInterceptor } from '@interceptors/logging.interceptor';
import { AllExceptionsFilter } from '@filters/http-exception.filter';
import { LoggerMiddleware } from '@middlewares/logger.middleware';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [HealthController, ProfilesController, MetricsController],
  providers: [
    GetProfileUseCase,
    GetMetricsUseCase,
    {
      provide: GITHUB_PORT,
      useClass: GitHubHttpAdapter,
    },
    {
      provide: CACHE_PORT,
      useClass: MemoryCacheAdapter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
