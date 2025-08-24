# Load Testing Documentation

## Overview

The Cake System includes a comprehensive k6 load testing suite designed to simulate up to **100,000 concurrent users** and validate system performance under extreme load conditions. The testing suite provides realistic authentication flow testing, detailed reporting, and real-time monitoring capabilities.

## Architecture

### Testing Framework

- **k6**: Modern load testing tool for APIs and microservices
- **Docker Support**: Containerized testing environment
- **Real-time Monitoring**: Grafana + InfluxDB integration
- **Comprehensive Reporting**: HTML, JSON, CSV, and text formats

### Test Scenarios

1. **Mixed Authentication Load**: Realistic user behavior simulation
2. **Login Stress Test**: Pure login endpoint performance testing
3. **Registration Burst Test**: High-frequency user registration testing
4. **Smoke Test**: Quick validation with minimal load
5. **Spike Test**: Sudden traffic spike simulation

## Quick Start

### Prerequisites

```bash
# Install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1

# Or using package managers
brew install k6                    # macOS
sudo apt install k6               # Ubuntu/Debian
choco install k6                  # Windows
```

### Basic Usage

```bash
# Navigate to load test directory
cd k6-load-test

# Run smoke test (quick validation)
./run-tests.sh --type smoke

# Run full 100k concurrent users test
./run-tests.sh --type mixed --monitoring

# Run with custom configuration
./run-tests.sh --url https://api.example.com --env production
```

## Test Scenarios

### 1. Mixed Authentication Load (Default)

**Purpose**: Simulate realistic user behavior with mixed authentication operations

**Configuration**:
```javascript
{
  executor: 'ramping-vus',
  stages: [
    { duration: '2m', target: 10000 },    // Ramp to 10k users
    { duration: '5m', target: 50000 },    // Ramp to 50k users
    { duration: '8m', target: 100000 },   // Ramp to 100k users
    { duration: '10m', target: 100000 },  // Sustain 100k users
    { duration: '3m', target: 50000 },    // Ramp down to 50k
    { duration: '2m', target: 0 },        // Ramp down to 0
  ]
}
```

**Load Distribution**:
- 70% Login operations
- 20% Registration operations
- 10% Profile access operations

**Usage**:
```bash
./run-tests.sh --type mixed
```

### 2. Login Stress Test

**Purpose**: Test pure login endpoint performance under heavy load

**Configuration**:
```javascript
{
  executor: 'constant-vus',
  vus: 20000,
  duration: '5m'
}
```

**Features**:
- 20,000 concurrent virtual users
- Continuous login operations for 5 minutes
- Uses pre-generated user database
- Focuses on authentication performance

**Usage**:
```bash
./run-tests.sh --type login
```

### 3. Registration Burst Test

**Purpose**: Test registration endpoint under high-frequency load

**Configuration**:
```javascript
{
  executor: 'ramping-arrival-rate',
  startRate: 100,
  stages: [
    { duration: '1m', target: 1000 },  // Ramp to 1000 RPS
    { duration: '2m', target: 5000 },  // Ramp to 5000 RPS
    { duration: '1m', target: 5000 },  // Sustain 5000 RPS
    { duration: '1m', target: 1000 },  // Ramp down
  ]
}
```

**Features**:
- Up to 5,000 registrations per second
- Realistic user data generation
- Database write performance testing
- Unique constraint validation testing

**Usage**:
```bash
./run-tests.sh --type register
```

### 4. Smoke Test

**Purpose**: Quick validation with minimal load for CI/CD pipelines

**Configuration**:
- 10 concurrent users
- 30 seconds duration
- Basic functionality validation

**Usage**:
```bash
./run-tests.sh --type smoke
```

### 5. Spike Test

**Purpose**: Test system resilience under sudden traffic spikes

**Configuration**:
```javascript
{
  stages: [
    { duration: '10s', target: 0 },     // Normal load
    { duration: '10s', target: 5000 },  // Spike to 5k users
    { duration: '30s', target: 5000 },  // Sustain spike
    { duration: '10s', target: 0 },     // Return to normal
  ]
}
```

**Usage**:
```bash
./run-tests.sh --type spike
```

## Configuration

### Environment Variables

```bash
# API Configuration
export BASE_URL="http://localhost:3000"
export ENVIRONMENT="local"  # local|staging|production

# Test Configuration
export K6_SCENARIO="mixedAuthTest"

# Monitoring Configuration
export K6_INFLUXDB_ORGANIZATION="k6-org"
export K6_INFLUXDB_BUCKET="k6-bucket"
export K6_INFLUXDB_TOKEN="k6-admin-token"
```

### Performance Thresholds

```javascript
thresholds: {
  // Response time thresholds
  'http_req_duration': [
    'p(50)<500',    // 50% of requests under 500ms
    'p(95)<2000',   // 95% of requests under 2s
    'p(99)<5000',   // 99% of requests under 5s
  ],
  
  // Error rate threshold
  'http_req_failed': ['rate<0.05'],  // Error rate < 5%
  
  // Endpoint-specific thresholds
  'http_req_duration{endpoint:login}': ['p(95)<1000'],
  'http_req_duration{endpoint:register}': ['p(95)<2000'],
  'http_req_duration{endpoint:profile}': ['p(95)<500'],
  
  // Throughput threshold
  'http_reqs': ['rate>1000'],  // > 1000 RPS
  
  // Virtual user limits
  'vus': ['value<=100000'],
  'vus_max': ['value<=100000'],
}
```

### Custom Configuration

Edit `k6-load-test/config.js` to modify:

```javascript
export const config = {
  BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',
  
  scenarios: {
    // Add custom scenarios here
    custom_test: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '2m',
      exec: 'customTest',
    }
  },
  
  // Custom thresholds
  thresholds: {
    'http_req_duration': ['p(95)<1500'],
    'http_req_failed': ['rate<0.02'],
  }
};
```

## Command Line Options

### run-tests.sh Usage

```bash
./run-tests.sh [OPTIONS]

Options:
  -u, --url URL          Base URL for the API (default: http://localhost:3000)
  -e, --env ENV          Environment (local|staging|production)
  -t, --type TYPE        Test type (mixed|login|register|smoke|stress|spike)
  -o, --output FORMAT    Output format (json,csv,html,influxdb,prometheus)
  -c, --clean            Clean results directory before running
  -m, --monitoring       Start monitoring stack (Grafana + InfluxDB)
  -h, --help             Show help message
```

### Examples

```bash
# Basic smoke test
./run-tests.sh --type smoke

# Full load test with monitoring
./run-tests.sh --type mixed --monitoring --clean

# Production environment testing
./run-tests.sh --url https://api.production.com --env production --type mixed

# Custom output formats
./run-tests.sh --type login --output "json,csv,html"

# Clean previous results
./run-tests.sh --clean --type register
```

## Monitoring & Reporting

### Real-time Monitoring

Start the monitoring stack:

```bash
# Start Grafana and InfluxDB
./run-tests.sh --monitoring

# Or using Docker Compose
docker-compose -f docker-compose.k6.yml up -d grafana influxdb
```

**Access Dashboards**:
- **Grafana**: http://localhost:3001 (admin/admin)
- **InfluxDB**: http://localhost:8086

### Generated Reports

After each test run, check the `results/` directory:

```
results/
├── summary.html              # Interactive HTML report
├── summary.txt               # Text summary
├── summary.json              # JSON summary data
├── load-test-results.json    # Detailed JSON results
├── load-test-results.csv     # CSV data for analysis
└── detailed-report.json      # Custom analysis report
```

### Key Metrics

**Performance Metrics**:
- Response time percentiles (p50, p95, p99)
- Request rate (RPS)
- Error rate percentage
- Concurrent virtual users

**Custom Metrics**:
- Authentication success rate
- Token generation time
- Database query time
- Endpoint-specific performance

**System Metrics**:
- CPU utilization
- Memory usage
- Database connections
- Network throughput

## Docker Usage

### Basic Docker Commands

```bash
# Run with Docker
npm run test:docker

# Run with InfluxDB output
npm run test:docker-influx

# Run with Prometheus output
npm run test:docker-prometheus
```

### Docker Compose Configuration

```yaml
# docker-compose.k6.yml
services:
  k6:
    image: grafana/k6:latest
    command: run --out influxdb=http://influxdb:8086/k6-bucket /scripts/main.js
    volumes:
      - ./:/scripts
    environment:
      - BASE_URL=http://host.docker.internal:3000
    depends_on:
      - influxdb

  influxdb:
    image: influxdb:2.0-alpine
    environment:
      - INFLUXDB_DB=k6
      - INFLUXDB_HTTP_AUTH_ENABLED=false
    ports:
      - "8086:8086"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Custom Docker Run

```bash
# Start monitoring only
docker-compose -f docker-compose.k6.yml up -d grafana influxdb

# Run specific test with monitoring
docker-compose -f docker-compose.k6.yml --profile influxdb-output up k6-influxdb

# Custom environment
docker run --rm -i grafana/k6 run \
  --out json=results.json \
  --env BASE_URL=http://api.example.com \
  - <main.js
```

## Test Data Management

### Pre-generated Users

The system includes 50,000 pre-generated users for consistent testing:

```javascript
// test-data.js
export const testUsers = [
  {
    fullname: "John Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    phone: "+1234567890",
    password: "testpassword123"
  },
  // ... 49,999 more users
];
```

### Realistic Data Generation

```javascript
// Generates realistic test data
function generateUser() {
  return {
    fullname: faker.name.fullName(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    phone: faker.phone.number('+1##########'),
    password: 'TestPass123!',
    birthday: faker.date.birthdate({ min: 18, max: 65, mode: 'age' })
  };
}
```

### Data Seeding

```bash
# Seed database with test users
cd k6-load-test
node seed-users.js --count 50000
```

## Performance Analysis

### Success Criteria

**System Performance Goals**:
- Error rate < 5%
- P95 response time < 2 seconds
- Handle 100,000 concurrent users
- No memory leaks or crashes
- Maintain 99.9% uptime during tests

**Endpoint-Specific Goals**:
- Login: P95 < 1 second
- Registration: P95 < 2 seconds
- Profile: P95 < 500ms

### Warning Signs

**Performance Issues**:
- Increasing error rates over time
- Response times degrading under load
- Database connection exhaustion
- Memory usage continuously growing
- CPU utilization > 80% sustained

**System Issues**:
- Connection timeouts
- Database deadlocks
- Out of memory errors
- Network saturation

### Optimization Recommendations

**Database Optimization**:
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_users_email_hash ON users USING hash(email);
CREATE INDEX CONCURRENTLY idx_users_username_hash ON users USING hash(username);
CREATE INDEX CONCURRENTLY idx_users_phone_hash ON users USING hash(phone);

-- Connection pooling optimization
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
```

**Application Optimization**:
```typescript
// Connection pooling
{
  type: 'postgres',
  pool: {
    min: 20,
    max: 100,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  }
}

// Caching strategy
@Injectable()
export class AuthService {
  constructor(
    private readonly cacheManager: Cache,
    // ... other dependencies
  ) {}
  
  async findUserById(id: string) {
    const cacheKey = `user:${id}`;
    let user = await this.cacheManager.get(cacheKey);
    
    if (!user) {
      user = await this.userRepository.findOne({ where: { id } });
      await this.cacheManager.set(cacheKey, user, 300); // 5 minutes
    }
    
    return user;
  }
}
```

**Server Configuration**:
```javascript
// Fastify optimization
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({
    bodyLimit: 1048576, // 1MB
    maxParamLength: 100,
  })
);

app.listen({
  port: 3000,
  host: '0.0.0.0',
  backlog: 1024
});
```

## Troubleshooting

### Common Issues

**1. High Error Rates**
```bash
# Check database connections
docker exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check server logs
docker logs cake-system-app

# Verify configuration
curl -I http://localhost:3000/health
```

**2. Slow Response Times**
```bash
# Check database query performance
docker exec postgres psql -U postgres -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Monitor system resources
docker stats

# Check network latency
ping localhost
```

**3. Connection Timeouts**
```bash
# Check server configuration
netstat -tulpn | grep :3000

# Verify load balancer
curl -v http://localhost:3000/health

# Check database connectivity
docker exec app npm run typeorm -- query "SELECT 1"
```

### Performance Tuning

**1. Database Tuning**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Update statistics
ANALYZE users;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE schemaname = 'public';
```

**2. Application Tuning**
```typescript
// Enable query logging
{
  type: 'postgres',
  logging: ['query', 'error', 'warn'],
  maxQueryExecutionTime: 1000,
}

// Add request timeout
app.use(timeout('30s'));
```

**3. System Tuning**
```bash
# Increase file descriptors
ulimit -n 65536

# Tune TCP settings
echo 'net.core.somaxconn = 1024' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 1024' >> /etc/sysctl.conf

# Apply changes
sysctl -p
```

## Continuous Integration

### CI/CD Integration

```yaml
# .github/workflows/load-test.yml
name: Load Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Start application
        run: |
          docker-compose up -d app postgres
          sleep 30
          
      - name: Run smoke test
        run: |
          cd k6-load-test
          ./run-tests.sh --type smoke --clean
          
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: k6-load-test/results/
```

### Automated Reporting

```bash
# Generate automated reports
./run-tests.sh --type mixed --output json,html
node generate-report.js results/load-test-results.json

# Send notifications
curl -X POST "https://hooks.slack.com/services/..." \
  -H 'Content-type: application/json' \
  --data '{"text":"Load test completed: 95% success rate, P95: 1.2s"}'
```

## Best Practices

### Test Design

1. **Realistic Load Patterns**: Use gradual ramp-up/down patterns
2. **Mixed Scenarios**: Combine different operations for realistic testing
3. **Data Variety**: Use diverse test data to avoid caching artifacts
4. **Environment Isolation**: Test in production-like environments

### Performance Testing

1. **Baseline Establishment**: Record baseline performance metrics
2. **Regression Testing**: Compare results against previous runs
3. **Threshold Monitoring**: Set and monitor performance thresholds
4. **Continuous Testing**: Integrate into CI/CD pipelines

### Monitoring and Analysis

1. **Real-time Monitoring**: Use Grafana dashboards during tests
2. **Comprehensive Reporting**: Generate multiple report formats
3. **Trend Analysis**: Track performance trends over time
4. **Alert Configuration**: Set up alerts for performance degradation

---

*Last Updated: 24 Aug 2025*
*Version: 1.0.0*
