import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import fastifyCompress from '@fastify/compress';
import logger from './common/logger';
import * as dotenv from 'dotenv';

import * as os from 'os';
process.env.UV_THREADPOOL_SIZE = `${os.cpus().length}`;

console.log(`Setting UV_THREADPOOL_SIZE to ${os.cpus().length}`);

// Load environment variables
dotenv.config();

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: false, // Disable Fastify logging (use custom)
        bodyLimit: 1048576, // 1MB body limit
        maxParamLength: 100, // Limit parameter length
        keepAliveTimeout: 5000, // Keep-alive timeout
        connectionTimeout: 10000, // Connection timeout
        trustProxy: 'loopback', // Trust requests from the loopback address
      }),
      {
        cors: {
          origin: true,
          credentials: true,
        },
        logger: WinstonModule.createLogger({ instance: logger }),
      },
    );

    // Enable compression
    await app.register(fastifyCompress, { encodings: ['gzip', 'deflate'], threshold: 1024 });

    // Enable global validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen({
      port,
      host: '0.0.0.0',
      backlog: 1024,
    });

    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.error('Error starting the application:', error);
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
