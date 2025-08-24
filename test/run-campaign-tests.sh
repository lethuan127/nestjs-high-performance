#!/bin/bash

# First Login Campaign E2E Test Runner
# This script sets up the environment and runs the campaign e2e tests

set -e

echo "🎯 First Login Campaign E2E Test Runner"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running in CI/CD or local environment
if [ "$CI" = "true" ]; then
    print_status "Running in CI/CD environment"
    USE_DOCKER=true
else
    print_status "Running in local development environment"
    USE_DOCKER=false
fi

# Function to run tests with Docker
run_tests_docker() {
    print_status "Setting up Docker test environment..."
    
    # Clean up any existing containers
    docker-compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
    
    # Start test services
    print_status "Starting test databases..."
    docker-compose -f docker-compose.test.yml up -d test-postgres test-redis
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Run migrations
    print_status "Running database migrations..."
    docker-compose -f docker-compose.test.yml exec -T test-postgres psql -U test_user -d cake_system_test -c "SELECT 1;" > /dev/null
    
    # Run tests
    print_status "Running First Login Campaign e2e tests..."
    if docker-compose -f docker-compose.test.yml run --rm test-app npm run test:e2e:campaign; then
        print_success "All tests passed!"
        TEST_RESULT=0
    else
        print_error "Some tests failed!"
        TEST_RESULT=1
    fi
    
    # Cleanup
    print_status "Cleaning up Docker containers..."
    docker-compose -f docker-compose.test.yml down -v --remove-orphans
    
    return $TEST_RESULT
}

# Function to run tests locally
run_tests_local() {
    print_status "Setting up local test environment..."
    
    # Set test environment variables
    export NODE_ENV=test
    export POSTGRES_HOST=${TEST_POSTGRES_HOST:-localhost}
    export POSTGRES_PORT=${TEST_POSTGRES_PORT:-5433}
    export POSTGRES_USER=${TEST_POSTGRES_USER:-test_user}
    export POSTGRES_PASSWORD=${TEST_POSTGRES_PASSWORD:-test_password}
    export POSTGRES_DATABASE=${TEST_POSTGRES_DATABASE:-cake_system_test}
    export REDIS_URL=${TEST_REDIS_URL:-redis://localhost:6379/1}
    
    # Setup test database
    print_status "Setting up test database..."
    if ! ./test/setup-test-db.sh; then
        print_error "Failed to setup test database"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Run the tests
    print_status "Running First Login Campaign e2e tests..."
    if npm run test:e2e:campaign; then
        print_success "All tests passed!"
        TEST_RESULT=0
    else
        print_error "Some tests failed!"
        TEST_RESULT=1
    fi
    
    # Cleanup if we started services
    if [ "$STARTED_POSTGRES" = "true" ]; then
        print_status "Stopping test PostgreSQL container..."
        docker stop cake-test-postgres > /dev/null 2>&1 || true
        docker rm cake-test-postgres > /dev/null 2>&1 || true
    fi
    
    if [ "$STARTED_REDIS" = "true" ]; then
        print_status "Stopping test Redis container..."
        docker stop cake-test-redis > /dev/null 2>&1 || true
        docker rm cake-test-redis > /dev/null 2>&1 || true
    fi
    
    return $TEST_RESULT
}

# Main execution
if [ "$USE_DOCKER" = "true" ]; then
    run_tests_docker
else
    run_tests_local
fi

TEST_EXIT_CODE=$?

echo ""
echo "========================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "First Login Campaign E2E Tests Completed Successfully! 🎉"
else
    print_error "First Login Campaign E2E Tests Failed! 💥"
fi
echo "========================================"

exit $TEST_EXIT_CODE
