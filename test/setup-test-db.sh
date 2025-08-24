#!/bin/bash

# Test Database Setup Script
# This script sets up a test database for e2e testing

set -e

echo "🚀 Setting up test database for e2e tests..."

# Load test environment variables
export NODE_ENV=test
export POSTGRES_HOST=${TEST_POSTGRES_HOST:-localhost}
export POSTGRES_PORT=${TEST_POSTGRES_PORT:-5433}
export POSTGRES_USER=${TEST_POSTGRES_USER:-test_user}
export POSTGRES_PASSWORD=${TEST_POSTGRES_PASSWORD:-test_password}
export POSTGRES_DATABASE=${TEST_POSTGRES_DATABASE:-cake_system_test}
export POSTGRES_SSL=false

echo "📊 Database Configuration:"
echo "  Host: $POSTGRES_HOST"
echo "  Port: $POSTGRES_PORT"
echo "  Database: $POSTGRES_DATABASE"
echo "  User: $POSTGRES_USER"

# Check if PostgreSQL is running
if ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on $POSTGRES_HOST:$POSTGRES_PORT"
    echo "Please start PostgreSQL or update the connection settings"
    exit 1
fi

# Create test database if it doesn't exist
echo "🗄️  Creating test database if it doesn't exist..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DATABASE'" | grep -q 1 || \
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c "CREATE DATABASE $POSTGRES_DATABASE"

# Run migrations on test database
echo "🔄 Running migrations on test database..."
npm run migration:run

echo "✅ Test database setup complete!"
echo ""
echo "To run e2e tests:"
echo "  npm run test:e2e -- --testNamePattern='First Login Campaign'"
echo ""
echo "To clean up test database:"
echo "  PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d postgres -c \"DROP DATABASE IF EXISTS $POSTGRES_DATABASE\""
