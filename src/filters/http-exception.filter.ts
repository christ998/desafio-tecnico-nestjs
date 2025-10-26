import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || message,
    };

    this.logger.error(`
╔═══════════════════════════════════════════════
║ 🚨 HTTP EXCEPTION
╠═══════════════════════════════════════════════
║ Status: ${status}
║ Method: ${request.method}
║ Path: ${request.url}
║ IP: ${request.ip}
║ User-Agent: ${request.get('user-agent') || 'N/A'}
║ Error: ${JSON.stringify(errorResponse.message, null, 2)}
╚═══════════════════════════════════════════════
    `);

    if (exception instanceof Error) {
      this.logger.error(`Stack Trace:\n${exception.stack}`);
    }

    response.status(status).json(errorResponse);
  }
}
