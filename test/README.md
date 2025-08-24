# E2E Testing Guide

This directory contains end-to-end tests for the Cake System, with comprehensive coverage of the first login campaign functionality.

## Test Structure

### `first-login-campaign.e2e-spec.ts`
Comprehensive e2e test covering the complete first login promotion flow:

- **Campaign Management**: Creating and retrieving campaigns
- **User Registration Flow**: User registration triggering first login events
- **Promotion Enrollment**: Automatic enrollment in campaigns via event handlers
- **Voucher Issuance**: Automatic voucher generation for first 100 users
- **Voucher Usage**: Complete mobile top-up flow with discount application
- **Edge Cases**: Duplicate participation prevention, invalid vouchers, minimum amounts
- **Concurrency**: Stress testing concurrent user registrations

## Prerequisites

1. **PostgreSQL**: Running instance for test database
2. **Redis**: Running instance for caching and queues
3. **Node.js**: Version 18+ with npm/pnpm

## Setup

### 1. Environment Configuration

Create a `.env.test` file or set environment variables:

```bash
# Test Database
TEST_POSTGRES_HOST=localhost
TEST_POSTGRES_PORT=5433
TEST_POSTGRES_USER=test_user
TEST_POSTGRES_PASSWORD=test_password
TEST_POSTGRES_DATABASE=cake_system_test

# Test Redis
TEST_REDIS_URL=redis://localhost:6379/1

# JWT
JWT_SECRET=test-jwt-secret-key
JWT_EXPIRATION_TIME=1h
```

### 2. Test Database Setup

Run the setup script to create and prepare the test database:

```bash
./test/setup-test-db.sh
```

Or manually:

```bash
# Create test database
createdb cake_system_test

# Run migrations
NODE_ENV=test npm run migration:run
```

## Running Tests

### All E2E Tests
```bash
npm run test:e2e
```

### Specific Test Suite
```bash
npm run test:e2e -- --testNamePattern="First Login Campaign"
```

### With Coverage
```bash
npm run test:e2e -- --coverage
```

### Debug Mode
```bash
npm run test:e2e -- --detectOpenHandles --forceExit
```

## Test Scenarios Covered

### 1. Campaign Management
- ✅ Create new promotion campaigns
- ✅ Retrieve active campaigns
- ✅ Campaign status and slot tracking

### 2. User Registration & First Login
- ✅ User registration triggers first login event
- ✅ Event handler processes promotion enrollment
- ✅ Automatic voucher issuance for first 100 users
- ✅ Participation order tracking

### 3. Voucher System
- ✅ Voucher code validation (CAKE-XXXXXXXX format)
- ✅ Voucher status management (ACTIVE → USED)
- ✅ Discount calculation (30% with min/max limits)
- ✅ Transaction reference tracking

### 4. Mobile Top-up Flow
- ✅ Top-up with voucher discount application
- ✅ Payment processing simulation
- ✅ Voucher usage marking
- ✅ Minimum amount validation

### 5. Edge Cases & Security
- ✅ Duplicate participation prevention
- ✅ Invalid voucher handling
- ✅ Used voucher reuse prevention
- ✅ Minimum top-up amount enforcement
- ✅ User ownership validation

### 6. Concurrency & Performance
- ✅ Concurrent user registration handling
- ✅ Race condition prevention with database locks
- ✅ Campaign slot accuracy under load

## Test Data Management

The tests automatically:
- Clean up test data before and after test runs
- Create isolated test campaigns
- Generate unique test users
- Handle database constraints and foreign keys

## Debugging Failed Tests

### Common Issues

1. **Database Connection**
   ```bash
   # Check PostgreSQL is running
   pg_isready -h localhost -p 5433
   
   # Check test database exists
   psql -h localhost -p 5433 -U test_user -d cake_system_test -c "\dt"
   ```

2. **Redis Connection**
   ```bash
   # Check Redis is running
   redis-cli -p 6379 ping
   ```

3. **Migration Issues**
   ```bash
   # Reset test database
   dropdb cake_system_test
   createdb cake_system_test
   NODE_ENV=test npm run migration:run
   ```

### Verbose Logging

Enable detailed logging during tests:

```bash
NODE_ENV=test LOG_LEVEL=debug npm run test:e2e
```

## Performance Expectations

- **Single user flow**: < 2 seconds
- **10 concurrent users**: < 5 seconds
- **Campaign creation**: < 500ms
- **Voucher validation**: < 100ms

## Continuous Integration

For CI/CD pipelines, use the Docker setup:

```yaml
# Example GitHub Actions step
- name: Run E2E Tests
  run: |
    docker-compose -f docker-compose.test.yml up -d
    npm run test:e2e
    docker-compose -f docker-compose.test.yml down
```

## Contributing

When adding new e2e tests:

1. Follow the existing test structure
2. Use proper cleanup in `beforeAll`/`afterAll`
3. Test both happy path and error scenarios
4. Include performance assertions for critical flows
5. Document any new test data requirements
