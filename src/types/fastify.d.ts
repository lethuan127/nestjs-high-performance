// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
