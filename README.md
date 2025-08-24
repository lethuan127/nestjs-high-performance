
# Cake System

A high-performance, scalable NestJS application featuring JWT authentication, promotion campaigns, and mobile top-up services. Built with TypeScript, PostgreSQL, Redis, and comprehensive monitoring capabilities.

## 🚀 Features

### Core Functionality
- **JWT Authentication**: Secure user registration, login, and profile management
- **Promotion Campaigns**: First login discount campaigns with voucher system
- **Mobile Top-up**: Bank transfer-based mobile phone top-up with discount vouchers
- **Event-Driven Architecture**: Asynchronous event processing with BullMQ
- **High Performance**: Optimized for 100,000+ concurrent users

### Technical Features
- **Horizontal Scaling**: Multi-replica deployment with Nginx load balancing
- **Comprehensive Monitoring**: OpenTelemetry instrumentation and health checks
- **Redis Caching**: User profile caching and session management
- **Database Optimization**: PostgreSQL with connection pooling and strategic indexing
- **Load Testing**: k6-based performance testing suite
- **Production Ready**: Docker containerization with resource limits

## 🏗️ Architecture

### Technology Stack
- **Framework**: NestJS with Fastify adapter
- **Database**: PostgreSQL 16 with TypeORM
- **Cache**: Redis 7 for session and data caching
- **Queue**: BullMQ for asynchronous job processing
- **Monitoring**: OpenTelemetry with OTLP exporters
- **Load Balancer**: Nginx with upstream configuration
- **Containerization**: Docker with multi-stage builds

### Core Modules
- **Authentication Module**: User management and JWT-based security
- **Promotions Module**: Campaign management and voucher system
- **Events Module**: Asynchronous event processing and queue management
- **Common Module**: Shared utilities, validators, and middleware

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher (preferred package manager)
- **Docker**: 24.x or higher
- **Docker Compose**: 2.x or higher
- **PostgreSQL**: 16.x (if running locally)
- **Redis**: 7.x (if running locally)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd cake-system
   ```

2. **Start the application**:
   ```bash
   # Start all services (app, database, cache, load balancer)
   docker-compose up -d

   # View logs
   docker-compose logs -f app
   ```

3. **Verify deployment**:
   ```bash
   # Check health status
   curl http://localhost:3000/health

   # Test authentication
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "fullname": "John Doe",
       "email": "john@example.com",
       "username": "johndoe",
       "phone": "+1234567890",
       "password": "securepass123",
       "birthday": "1990-01-01"
     }'
   ```

### Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment**:
   ```bash
   cp env.template .env
   # Edit .env with your configuration
   ```

3. **Start database services**:
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Run database migrations**:
   ```bash
   pnpm run migration:run
   ```

5. **Start the application**:
   ```bash
   # Development mode with hot reload
   pnpm run start:dev

   # Debug mode
   pnpm run start:debug
   ```

## 📖 Documentation

### Comprehensive Guides
- **[Authentication System](docs/AUTHENTICATION.md)**: JWT-based user authentication and security
- **[Promotion Flow](docs/PROMOTION_FLOW.md)**: First login campaign and voucher system
- **[Performance Guide](docs/PERFORMANCE.md)**: System performance, monitoring, and optimization
- **[Load Testing](docs/LOAD_TESTING.md)**: k6-based performance testing suite

### API Endpoints

#### Authentication
```bash
POST /auth/register     # User registration
POST /auth/login        # User login
GET  /auth/profile      # Get user profile (protected)
POST /auth/refresh      # Refresh JWT token (protected)
```

#### Promotions
```bash
# Campaign Management
POST /promotions/campaigns              # Create campaign (admin)
GET  /promotions/campaigns              # List active campaigns
GET  /promotions/campaigns/:id          # Get campaign details

# User Promotions
GET  /promotions/eligibility            # Check eligibility (protected)
GET  /promotions/my-promotions          # User's promotions (protected)
GET  /promotions/my-vouchers            # User's vouchers (protected)
POST /promotions/topup                  # Mobile top-up (protected)

# Voucher Management
GET  /promotions/vouchers/:code/validate # Validate voucher code
```

#### System
```bash
GET  /health                           # Health check endpoint
GET  /admin/events/queue-stats         # Queue statistics
POST /admin/events/retry-failed        # Retry failed jobs
```

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
pnpm run test

# Run tests with coverage
pnpm run test:cov

# Run tests in watch mode
pnpm run test:watch
```

### End-to-End Tests
```bash
# Run all e2e tests
pnpm run test:e2e

# Run campaign-specific tests
pnpm run test:e2e:campaign

# Run with database setup
pnpm run test:e2e:campaign:full
```

### Load Testing
```bash
# Navigate to load testing directory
cd k6-load-test

# Run smoke test (quick validation)
./run-tests.sh --type smoke

# Run full load test (100k users)
./run-tests.sh --type mixed --monitoring

# Run specific test scenarios
./run-tests.sh --type login      # Login stress test
./run-tests.sh --type register   # Registration burst test
./run-tests.sh --type spike      # Traffic spike test
```

## 🏭 Production Deployment

### Docker Production Build
```bash
# Build production image
pnpm run docker:build:prod

# Start production environment
docker-compose -f docker-compose.yml up -d
```

### Environment Configuration
```bash
# Required environment variables
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
POSTGRES_HOST=your-postgres-host
POSTGRES_PASSWORD=your-secure-password
REDIS_URL=redis://your-redis-host:6379/0
OTEL_EXPORTER_OTLP_GRPC_ENDPOINT=http://your-otel-collector:4317
```

### Database Management
```bash
# Generate migration
pnpm run migration:generate

# Run migrations
pnpm run migration:run

# Revert migration
pnpm run migration:revert

# Show migration status
pnpm run migration:show
```

## 📊 Monitoring & Performance

### Health Monitoring
The system includes comprehensive health checks:
- Database connectivity
- Redis cache availability  
- Memory usage monitoring
- Response time tracking

### Performance Metrics
- **Concurrent Users**: 100,000+ simultaneous connections
- **Response Time**: P95 < 2s, P99 < 5s
- **Error Rate**: < 1% under normal load, < 5% under extreme load
- **Throughput**: 10,000+ requests per second

### OpenTelemetry Integration
Full distributed tracing with:
- HTTP request/response monitoring
- Database query performance tracking
- Redis operations monitoring
- Queue job processing metrics
- Custom business metrics

## 🔧 Development

### Project Structure
```
cake-system/
├── src/
│   ├── auth/                 # Authentication module
│   ├── promotions/           # Promotion campaigns module
│   ├── events/               # Event processing module
│   ├── common/               # Shared utilities
│   ├── config/               # Configuration files
│   └── migrations/           # Database migrations
├── test/                     # End-to-end tests
├── k6-load-test/            # Load testing suite
├── docs/                    # Documentation
├── nginx/                   # Load balancer configuration
└── docker-compose.yml       # Container orchestration
```

### Code Quality
```bash
# Linting
pnpm run lint

# Code formatting
pnpm run format

# Type checking
pnpm run build
```

### Database Operations
```bash
# Connect to database
docker exec -it cake-system-postgres psql -U postgres -d cake_system

# View logs
docker-compose logs -f postgres

# Backup database
docker exec cake-system-postgres pg_dump -U postgres cake_system > backup.sql
```

## 🚨 Troubleshooting

### Common Issues

**High Error Rates**:
```bash
# Check application logs
docker-compose logs -f app

# Check database connections
docker exec cake-system-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Verify health status
curl http://localhost:3000/health
```

**Performance Issues**:
```bash
# Monitor system resources
docker stats

# Check database performance
docker exec cake-system-postgres psql -U postgres -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Review slow query logs
docker-compose logs postgres | grep "slow"
```

**Connection Issues**:
```bash
# Test database connectivity
docker exec cake-system-app npm run typeorm -- query "SELECT 1"

# Test Redis connectivity
docker exec cake-system-redis redis-cli ping

# Check network connectivity
docker network ls
docker network inspect cake-system_cake-network
```

## 📈 Performance Benchmarks

TODO

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Ensure all tests pass
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/) - A progressive Node.js framework
- Database powered by [PostgreSQL](https://www.postgresql.org/)
- Caching with [Redis](https://redis.io/)
- Load testing with [k6](https://k6.io/)
- Monitoring with [OpenTelemetry](https://opentelemetry.io/)
