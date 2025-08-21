import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as fastifyCors from '@fastify/cors';

// Load environment variables
dotenv.config();

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    // Enable global validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.register(fastifyCors, {
      origin: true,
      credentials: true,
    });

    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen({
      port,
      host: '0.0.0.0',
    });

    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.error('Error starting the application:', error);
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
