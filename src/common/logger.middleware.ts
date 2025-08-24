import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { hrtime } from 'node:process';

@Injectable()
class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: FastifyRequest['raw'], response: FastifyReply['raw'], next: () => void) {
    const start = hrtime.bigint();

    response.on('finish', () => {
      const time = Number(hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      const { method, url } = request;
      const { statusCode, statusMessage } = response;

      // Get response size from content-length header
      const contentLength = response.getHeader('content-length') as string;
      const size = contentLength ? `${contentLength} bytes` : 'unknown size';

      const logMessage = `${method} ${url} ${statusCode} ${statusMessage} - ${time}ms - ${size}`;

      if (statusCode >= 500) {
        return this.logger.error(logMessage);
      }

      if (statusCode >= 400) {
        return this.logger.warn(logMessage);
      }

      return this.logger.log(logMessage);
    });

    next();
  }
}

export default LoggerMiddleware;
