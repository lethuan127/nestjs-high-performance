// k6 Load Test Configuration for 100,000 Concurrent Users
export const config = {
  // Base URL for the API
  BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',
  
  // Test scenarios configuration
  scenarios: {
    // Scenario 1: Mixed authentication load (70% login, 20% register, 10% profile)
    mixed_auth_load: {
      executor: 'ramping-vus',
      stages: [
        // Ramp up to 10k users over 2 minutes
        { duration: '2m', target: 10000 },
        // Ramp up to 50k users over 5 minutes
        { duration: '5m', target: 50000 },
        // Ramp up to 100k users over 8 minutes
        { duration: '8m', target: 100000 },
        // Stay at 100k users for 10 minutes
        { duration: '10m', target: 100000 },
        // Ramp down to 50k users over 3 minutes
        { duration: '3m', target: 50000 },
        // Ramp down to 0 users over 2 minutes
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
      exec: 'mixedAuthTest',
    },

    // Scenario 2: Login stress test (pure login load)
    login_stress: {
      executor: 'constant-vus',
      vus: 20000,
      duration: '5m',
      exec: 'loginStressTest',
      startTime: '30m', // Start after mixed test
    },

    // Scenario 3: Registration burst test
    registration_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      stages: [
        { duration: '1m', target: 1000 }, // Ramp up to 1000 RPS
        { duration: '2m', target: 5000 }, // Ramp up to 5000 RPS
        { duration: '1m', target: 5000 }, // Stay at 5000 RPS
        { duration: '1m', target: 1000 }, // Ramp down to 1000 RPS
      ],
      preAllocatedVUs: 1000,
      maxVUs: 10000,
      exec: 'registrationBurstTest',
      startTime: '35m', // Start after login stress test
    },
  },

  // Thresholds for performance criteria
  thresholds: {
    // HTTP request duration
    'http_req_duration': [
      'p(50)<500',    // 50% of requests should be below 500ms
      'p(95)<2000',   // 95% of requests should be below 2s
      'p(99)<5000',   // 99% of requests should be below 5s
    ],
    
    // HTTP request failure rate
    'http_req_failed': [
      'rate<0.05',    // Error rate should be less than 5%
    ],
    
    // Specific endpoint thresholds
    'http_req_duration{endpoint:login}': ['p(95)<1000'],
    'http_req_duration{endpoint:register}': ['p(95)<2000'],
    'http_req_duration{endpoint:profile}': ['p(95)<500'],
    
    // Request rate
    'http_reqs': ['rate>1000'], // Should handle at least 1000 RPS
    
    // Virtual user metrics
    'vus': ['value<=100000'], // Should not exceed 100k VUs
    'vus_max': ['value<=100000'],
  },

  // Test options
  options: {
    // DNS resolution
    dns: {
      ttl: '1m',
      select: 'random',
    },
    
    // HTTP settings
    http: {
      responseCallback: null,
    },
    
    // Batch settings for better performance
    batch: 20,
    batchPerHost: 10,
    
    // Connection settings
    hosts: {},
    insecureSkipTLSVerify: true,
    
    // User agent
    userAgent: 'k6-load-test/1.0',
  },

  // Monitoring and reporting
  monitoring: {
    // Enable real-time metrics
    enableRealTimeMetrics: true,
    
    // Custom metrics
    customMetrics: [
      'auth_success_rate',
      'token_generation_time',
      'db_query_time',
    ],
    
    // Output configuration
    outputs: {
      json: 'results/load-test-results.json',
      csv: 'results/load-test-results.csv',
    },
  },
};

// Environment-specific configurations
export const environments = {
  local: {
    BASE_URL: 'http://localhost:3000',
    DB_POOL_SIZE: 20,
  },
  
  staging: {
    BASE_URL: 'https://staging-api.yourdomain.com',
    DB_POOL_SIZE: 100,
  },
  
  production: {
    BASE_URL: 'https://api.yourdomain.com',
    DB_POOL_SIZE: 200,
  },
};

// Get current environment config
export function getEnvironmentConfig() {
  const env = __ENV.ENVIRONMENT || 'local';
  return environments[env] || environments.local;
}
