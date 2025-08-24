// Test environment configuration
// This file sets up environment variables for e2e testing

export const setupTestEnvironment = () => {
  // Use in-memory SQLite for faster testing or dedicated test database
  process.env.NODE_ENV = 'test';
  
  // Test database configuration
  process.env.POSTGRES_HOST = process.env.TEST_POSTGRES_HOST || 'localhost';
  process.env.POSTGRES_PORT = process.env.TEST_POSTGRES_PORT || '5433'; // Different port for test DB
  process.env.POSTGRES_USER = process.env.TEST_POSTGRES_USER || 'test_user';
  process.env.POSTGRES_PASSWORD = process.env.TEST_POSTGRES_PASSWORD || 'test_password';
  process.env.POSTGRES_DATABASE = process.env.TEST_POSTGRES_DATABASE || 'cake_system_test';
  process.env.POSTGRES_SSL = 'false';
  
  // Redis configuration for testing (use different DB)
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
  
  // JWT configuration
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-testing';
  process.env.JWT_EXPIRATION_TIME = '1h';
  
  // Disable external services in test mode
  process.env.DISABLE_PAYMENT_GATEWAY = 'true';
  process.env.DISABLE_NOTIFICATIONS = 'true';
  
  // Logging configuration
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during testing
  
  console.log('Test environment configured');
};
