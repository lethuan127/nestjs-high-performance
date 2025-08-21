interface AuthUser {
  sub: string;
  fullname: string;
  username: string;
  email: string;
  phone: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
