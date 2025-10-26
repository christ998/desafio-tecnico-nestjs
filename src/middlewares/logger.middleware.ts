import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(
      `→ ${method} ${originalUrl} - IP: ${ip} - UserAgent: ${userAgent}`,
    );

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const contentLength = res.get('content-length') || 0;

      if (statusCode >= 500) {
        this.logger.error(
          `← ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength} bytes`,
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `← ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength} bytes`,
        );
      } else {
        this.logger.log(
          `← ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength} bytes`,
        );
      }
    });

    next();
  }
}
