import { randomUUID } from 'crypto';
import { ClsMiddlewareOptions, ClsStore } from 'nestjs-cls';
import type { FastifyRequest, FastifyReply } from 'fastify';

/* eslint-disable */
export const clsMiddlewareOptions: ClsMiddlewareOptions = {
  mount: true,
  generateId: true,
  idGenerator: (req: FastifyRequest) =>
    (req.headers['x-span-id'] as string ||
    req.headers['x-trace-id'] as string ||
    req.headers['x-request-id'] as string ||
    req.headers['x-correlation-id'] as string ||
    req.headers['x-amzn-trace-id'] as string ||
    randomUUID()) as string,
  setup: (cls, req: FastifyRequest, res: FastifyReply) => {
    res.header('x-request-id', cls.getId());
  },
};

export interface ContextStore extends ClsStore {
  userId?: string;
}
