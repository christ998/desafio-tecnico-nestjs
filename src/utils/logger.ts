import { Logger as NestLogger } from '@nestjs/common';

export class Logger extends NestLogger {
  start(label: string, context?: string): number {
    this.log(`Start ${label}`, context);
    return Date.now();
  }

  end(label: string, startTime: number, context?: string) {
    const duration = Date.now() - startTime;
    this.log(`End ${label} (${duration}ms)`, context);
  }
}
