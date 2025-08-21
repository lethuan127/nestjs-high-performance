# Docker Setup for Cake System

This document provides instructions for running the Cake System using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.0 or higher
- Docker Compose 2.0 or higher
- Git (for cloning the repository)

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd cake-system
   ```

2. **Create environment file**:
   ```bash
   cp env.template .env
   ```
   Edit the `.env` file with your specific configuration.

3. **Start the application**:
   ```bash
   pnpm run docker:up
   ```

4. **View logs**:
   ```bash
   pnpm run docker:logs
   ```

The application will be available at:
- **API**: http://localhost:3000
- **pgAdmin**: http://localhost:8080 (admin@cake-system.local / admin)

## Available Docker Scripts

The following npm scripts are available for Docker operations:

```bash
# Build Docker image
pnpm run docker:build

# Build production Docker image
pnpm run docker:build:prod

# Start all services in detached mode
pnpm run docker:up

# Stop all services
pnpm run docker:down

# View application logs
pnpm run docker:logs

# Restart the application service
pnpm run docker:restart

# Stop services and remove volumes/orphans
pnpm run docker:clean
```

## Docker Compose Services

### Development Environment (`docker-compose.yml`)

- **app**: NestJS application in development mode with hot reload
- **postgres**: PostgreSQL 16 database
- **pgAdmin**: Database management interface (optional)

### Production Environment (`docker-compose.prod.yml`)

- **app**: Optimized NestJS application for production
- **postgres**: PostgreSQL 16 database with health checks

## Environment Configuration

### Development
The development environment uses default values defined in `docker-compose.yml`. You can override these by creating a `.env` file:

```env
NODE_ENV=development
PORT=3000
DEBUG=true
LOG_LEVEL=debug

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=cake_system
POSTGRES_SSL=false

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Production
For production, create a `.env.production` file with secure values:

```env
NODE_ENV=production
PORT=3000
DEBUG=false
LOG_LEVEL=info

POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DATABASE=cake_system_prod
POSTGRES_SSL=true

JWT_SECRET=your-very-secure-jwt-secret-key
JWT_EXPIRES_IN=1d
```

## Usage Instructions

### Development

1. **Start development environment**:
   ```bash
   docker-compose up -d
   ```

2. **Watch logs**:
   ```bash
   docker-compose logs -f app
   ```

3. **Run database migrations**:
   ```bash
   docker-compose exec app pnpm run migration:run
   ```

4. **Access the application**:
   - API: http://localhost:3000
   - Database: localhost:5432
   - pgAdmin: http://localhost:8080

### Production

1. **Start production environment**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Scale the application** (if needed):
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --scale app=3
   ```

## Database Management

### Accessing PostgreSQL directly
```bash
docker-compose exec postgres psql -U postgres -d cake_system
```

### Running migrations
```bash
# Development
docker-compose exec app pnpm run migration:run

# Production
docker-compose -f docker-compose.prod.yml exec app node dist/migration-runner.js
```

### Backup database
```bash
docker-compose exec postgres pg_dump -U postgres cake_system > backup.sql
```

### Restore database
```bash
docker-compose exec -T postgres psql -U postgres cake_system < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   - Change ports in `docker-compose.yml` if 3000 or 5432 are in use
   - Update your `.env` file accordingly

2. **Permission issues**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

3. **Database connection issues**:
   - Ensure PostgreSQL is healthy: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`

4. **Application not starting**:
   - Check application logs: `docker-compose logs app`
   - Verify environment variables are set correctly

### Cleanup

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Remove Docker images
docker rmi cake-system cake-system:prod

# Clean up Docker system (use with caution)
docker system prune -a
```

## Development Workflow

1. **Make code changes** - files are automatically synced via volume mounts
2. **Hot reload** - NestJS automatically restarts on file changes
3. **Database changes** - run migrations: `docker-compose exec app pnpm run migration:generate`
4. **Testing** - run tests: `docker-compose exec app pnpm test`

## Security Notes

- Change default passwords in production
- Use strong JWT secrets
- Enable SSL for database connections in production
- Regularly update Docker images
- Use secrets management for sensitive data

## Performance Optimization

- Use multi-stage builds (already configured)
- Optimize Docker images with `.dockerignore`
- Use health checks for better container management
- Consider using Docker Swarm or Kubernetes for production scaling
