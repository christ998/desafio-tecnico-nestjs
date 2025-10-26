import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API');

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, params, query, body } = request;
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const startTime = Date.now();

    this.logger.debug(`
┌─ Request Details ────────────────────────────
│ Controller: ${controller}
│ Handler: ${handler}
│ Method: ${method}
│ URL: ${url}
│ Params: ${JSON.stringify(params)}
│ Query: ${JSON.stringify(query)}
│ Body: ${JSON.stringify(body)}
└──────────────────────────────────────────────
    `);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logger.debug(`
┌─ Response Details ───────────────────────────
│ Controller: ${controller}
│ Handler: ${handler}
│ Duration: ${duration}ms
│ Data: ${JSON.stringify(data).substring(0, 200)}${JSON.stringify(data).length > 200 ? '...' : ''}
└──────────────────────────────────────────────
        `);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(`
┌─ Error Details ──────────────────────────────
│ Controller: ${controller}
│ Handler: ${handler}
│ Duration: ${duration}ms
│ Error: ${error.message}
│ Stack: ${error.stack}
└──────────────────────────────────────────────
        `);
        throw error;
      }),
    );
  }
}
