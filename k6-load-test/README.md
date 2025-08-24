# k6 Load Test Suite - 100,000 Concurrent Users

A comprehensive load testing suite for the Authentication System capable of simulating **100,000 concurrent users** using k6.

## 🎯 Overview

This load testing suite is designed to test your authentication system under extreme load conditions. It includes multiple test scenarios, real-time monitoring, and detailed reporting to help you identify performance bottlenecks and ensure your system can handle high-traffic scenarios.

### Test Scenarios

1. **Mixed Authentication Load** (70% login, 20% register, 10% profile access)
2. **Login Stress Test** (Pure login load with 20,000 concurrent users)
3. **Registration Burst Test** (High-frequency user registration)

### Key Features

- ✅ **100,000 concurrent users** simulation
- ✅ **Real-time monitoring** with Grafana and InfluxDB
- ✅ **Comprehensive reporting** (HTML, JSON, CSV)
- ✅ **Multiple test scenarios** for different load patterns
- ✅ **Docker support** for easy deployment
- ✅ **Realistic test data** generation
- ✅ **Performance thresholds** and SLA monitoring

## 🚀 Quick Start

### Prerequisites

1. **k6 installed**: [Installation Guide](https://k6.io/docs/get-started/installation/)
2. **Docker** (optional, for monitoring): [Docker Installation](https://docs.docker.com/get-docker/)
3. **Your API running** on `http://localhost:3000` (or configure different URL)

### Basic Usage

```bash
# Clone and navigate to the load test directory
cd k6-load-test

# Run a quick smoke test (10 users for 30 seconds)
./run-tests.sh --type smoke

# Run the full 100k concurrent users test
./run-tests.sh --type mixed --monitoring

# Run with custom URL
./run-tests.sh --url https://your-api.com --env production
```

## 📋 Test Types

### 1. Smoke Test
Quick validation with minimal load:
```bash
./run-tests.sh --type smoke
```
- **Users**: 10 concurrent
- **Duration**: 30 seconds
- **Purpose**: Basic functionality validation

### 2. Mixed Load Test (Default)
Realistic user behavior simulation:
```bash
./run-tests.sh --type mixed
```
- **Peak Users**: 100,000 concurrent
- **Duration**: ~30 minutes
- **Scenarios**: Login (70%), Register (20%), Profile (10%)
- **Ramp Pattern**: Gradual increase to peak, sustained load, gradual decrease

### 3. Login Stress Test
Pure login load testing:
```bash
./run-tests.sh --type login
```
- **Users**: 20,000 concurrent
- **Duration**: 5 minutes
- **Focus**: Login endpoint performance

### 4. Registration Burst Test
High-frequency user registration:
```bash
./run-tests.sh --type register
```
- **Rate**: Up to 5,000 registrations/second
- **Duration**: 5 minutes
- **Focus**: Registration endpoint and database writes

### 5. Spike Test
Sudden traffic spike simulation:
```bash
./run-tests.sh --type spike
```
- **Pattern**: 0 → 5,000 → 5,000 → 0 users
- **Duration**: 50 seconds
- **Purpose**: Test system resilience

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
export BASE_URL="http://localhost:3000"
export ENVIRONMENT="local"  # local|staging|production

# Test Configuration
export K6_SCENARIO="mixedAuthTest"  # Specific scenario to run

# Monitoring Configuration
export K6_INFLUXDB_ORGANIZATION="k6-org"
export K6_INFLUXDB_BUCKET="k6-bucket"
export K6_INFLUXDB_TOKEN="k6-admin-token"
```

### Custom Configuration

Edit `config.js` to modify:
- Test scenarios and load patterns
- Performance thresholds
- Test data generation
- Monitoring settings

## 📊 Monitoring & Reporting

### Real-time Monitoring

Start the monitoring stack:
```bash
./run-tests.sh --monitoring
```

Access dashboards:
- **Grafana**: http://localhost:3001 (admin/admin)
- **InfluxDB**: http://localhost:8086

### Reports Generated

After each test run, check the `results/` directory:

```
results/
├── summary.html          # Interactive HTML report
├── summary.txt           # Text summary
├── load-test-results.json # Detailed JSON results
├── load-test-results.csv  # CSV data for analysis
└── detailed-report.json   # Custom analysis report
```

### Key Metrics Monitored

- **Response Time**: p50, p95, p99 percentiles
- **Error Rate**: Failed requests percentage
- **Throughput**: Requests per second
- **Concurrent Users**: Active virtual users
- **Endpoint Performance**: Per-endpoint metrics
- **Custom Metrics**: Authentication success rate, token generation time

## 🎛️ Command Line Options

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

## 🐳 Docker Usage

### Basic Docker Run
```bash
# Run with Docker
npm run test:docker

# Run with InfluxDB output
npm run test:docker-influx

# Run with Prometheus output
npm run test:docker-prometheus
```

### Custom Docker Configuration
```bash
# Start monitoring only
docker-compose -f docker-compose.k6.yml up -d grafana influxdb

# Run specific test with monitoring
docker-compose -f docker-compose.k6.yml --profile influxdb-output up k6-influxdb
```

## 📈 Performance Thresholds

The tests include predefined SLA thresholds:

```javascript
thresholds: {
  'http_req_duration': [
    'p(50)<500',    // 50% of requests under 500ms
    'p(95)<2000',   // 95% of requests under 2s
    'p(99)<5000',   // 99% of requests under 5s
  ],
  'http_req_failed': ['rate<0.05'],    // Error rate < 5%
  'http_reqs': ['rate>1000'],          // Throughput > 1000 RPS
}
```

## 🔍 Test Data

The suite generates realistic test data:

- **50,000 pre-generated users** for consistent login testing
- **Realistic names, emails, phone numbers**
- **Multiple email domains** for variety
- **Valid phone number formats**
- **Secure password patterns**

## 🚨 Troubleshooting

### Common Issues

1. **High Error Rates**
   - Check database connection limits
   - Verify JWT secret configuration
   - Monitor server resources (CPU, memory)

2. **Slow Response Times**
   - Review database query performance
   - Check for N+1 query problems
   - Consider connection pooling optimization

3. **Connection Timeouts**
   - Increase server timeout settings
   - Check network configuration
   - Verify load balancer settings

### Performance Optimization Tips

1. **Database Optimization**
   ```sql
   -- Add indexes for frequently queried fields
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_username ON users(username);
   CREATE INDEX idx_users_phone ON users(phone);
   ```

2. **Connection Pooling**
   ```javascript
   // Increase database connection pool
   pool: {
     min: 20,
     max: 100,
     acquireTimeoutMillis: 30000,
     idleTimeoutMillis: 30000
   }
   ```

3. **Caching Strategy**
   - Implement Redis for session storage
   - Cache frequently accessed user data
   - Use CDN for static assets

4. **Server Configuration**
   ```javascript
   // Increase server limits
   app.listen({
     port: 3000,
     host: '0.0.0.0',
     backlog: 1024
   });
   ```

## 📝 Test Results Analysis

### Interpreting Results

1. **Success Criteria**
   - Error rate < 5%
   - P95 response time < 2 seconds
   - System handles 100k concurrent users
   - No memory leaks or crashes

2. **Warning Signs**
   - Increasing error rates over time
   - Response times degrading under load
   - Database connection exhaustion
   - Memory usage continuously growing

### Scaling Recommendations

Based on test results, consider:

- **Horizontal Scaling**: Add more server instances
- **Database Scaling**: Read replicas, connection pooling
- **Caching**: Redis/Memcached implementation
- **Load Balancing**: Distribute traffic effectively
- **CDN**: Reduce server load for static content

## 🔗 Integration

### CI/CD Pipeline Integration

```yaml
# GitHub Actions example
- name: Run Load Tests
  run: |
    cd k6-load-test
    ./run-tests.sh --type smoke --url ${{ secrets.STAGING_URL }}
    
- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: load-test-results
    path: k6-load-test/results/
```

### Monitoring Integration

Connect to your existing monitoring:
- **Prometheus**: Use `--out experimental-prometheus-rw`
- **DataDog**: Configure DataDog k6 extension
- **New Relic**: Use New Relic k6 integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your test scenarios or improvements
4. Test your changes
5. Submit a pull request

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/performance-testing/)
- [k6 Extensions](https://k6.io/docs/extensions/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Quick Commands Reference

```bash
# Quick smoke test
./run-tests.sh --type smoke

# Full load test with monitoring
./run-tests.sh --type mixed --monitoring --clean

# Production test
./run-tests.sh --url https://api.production.com --env production

# Clean and run stress test
./run-tests.sh --type stress --clean

# Docker with monitoring
npm run test:docker-influx
```

**Ready to test your system at scale? Start with a smoke test and work your way up to 100k users!** 🚀
