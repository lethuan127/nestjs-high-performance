import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { CleanedEnv, bool, cleanEnv, num, str } from 'envalid';

config();

const envSchema = {
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
} as const;

type Env = CleanedEnv<typeof envSchema>;
const env: Env = cleanEnv(process.env, envSchema);

const configService = new ConfigService<Env>(env as Record<string, any>);

export default configService;
