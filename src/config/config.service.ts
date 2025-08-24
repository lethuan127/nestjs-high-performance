import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { CleanedEnv, bool, cleanEnv, num, str, url } from 'envalid';

config();

const envSchema = {
  APP_ENV: str({ default: 'development' }),
  NODE_ENV: str({ default: 'development' }),
  PORT: num({ default: 3000 }),

  DEBUG: bool({ default: false }),
  LOG_LEVEL: str({ default: 'info' }),

  POSTGRES_HOST: str(),
  POSTGRES_PORT: num({ default: 5432 }),
  POSTGRES_USER: str(),
  POSTGRES_PASSWORD: str(),
  POSTGRES_DATABASE: str(),
  POSTGRES_SSL: bool({ default: true }),

  JWT_SECRET: str(),
  JWT_EXPIRES_IN: str(),

  OTEL_EXPORTER_OTLP_HTTP_ENDPOINT: url({ default: '' }),
  OTEL_EXPORTER_OTLP_GRPC_ENDPOINT: url({ default: '' }),

  REDIS_URL: str(),
  REDIS_TTL: num({ default: 3600 }),
} as const;

type Env = CleanedEnv<typeof envSchema>;
const env: Env = cleanEnv(process.env, envSchema);

const configService = new ConfigService<Env>(env as Record<string, any>);

export default configService;
