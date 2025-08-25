import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { config, getEnvironmentConfig } from './config.js';
import { generateTestUser, generateLoginCredentials } from './test-data.js';

// Custom metrics
const authSuccessRate = new Rate('auth_success_rate');
const tokenGenerationTime = new Trend('token_generation_time');
const loginAttempts = new Counter('login_attempts');
const registrationAttempts = new Counter('registration_attempts');
const profileRequests = new Counter('profile_requests');

// Global configuration
const envConfig = getEnvironmentConfig();
const BASE_URL = envConfig.BASE_URL;

// HTTP request options
const httpOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: '30s',
};

// Shared state for authenticated users
let authenticatedUsers = [];

// Export options for k6 - merge scenarios and thresholds from config
export const options = {
  scenarios: config.scenarios,
  thresholds: config.thresholds,
  ...config.options,
};

// Default export function for simple k6 runs
export default function() {
  // Default to mixed auth test for simple runs
  mixedAuthTest();
}

export function healthCheck() {
  sleep(Math.random() * 2 + 0.5);
  group('Health Check', () => {
    const healthResponse = http.get(`${BASE_URL}/health`);
    check(healthResponse, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 200ms': (r) => r.timings.duration < 200,
    });
  });
}

// Scenario 1: Mixed authentication load test
export function mixedAuthTest() {
  // Random sleep between 1-5 seconds to simulate real user behavior
  sleep(Math.random() * 4 + 1);
  const testType = Math.random();
  
  if (testType < 0.7) {
    // 70% login tests
    loginFlow();
  } else if (testType < 0.9) {
    // 20% registration tests
    registrationFlow();
  } else {
    // 10% profile access tests
    profileFlow();
  }
}

// Scenario 2: Login stress test
export function loginStressTest() {
  group('Login Stress Test', () => {
    loginFlow();
    sleep(Math.random() * 2 + 0.5); // Shorter sleep for stress test
  });
}

// Scenario 3: Registration burst test
export function registrationBurstTest() {
  group('Registration Burst Test', () => {
    registrationFlow();
    sleep(Math.random() * 1 + 0.5); // Very short sleep for burst test
  });
}

// Login flow function
function loginFlow() {
  group('User Login Flow', () => {
    const credentials = generateLoginCredentials();
    
    const loginPayload = {
      account: credentials.account,
      password: credentials.password,
    };

    const loginStartTime = Date.now();
    
    const loginResponse = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify(loginPayload),
      {
        ...httpOptions,
        tags: { endpoint: 'login' },
      }
    );

    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.access_token !== undefined;
        } catch (error) {
          console.error('Failed to parse login response:', error);
          return false;
        }
      },
      'login response time < 200ms': (r) => r.timings.duration < 200,
    });

    loginAttempts.add(1);
    authSuccessRate.add(loginSuccess);
    
    if (loginSuccess) {
      const tokenGenTime = Date.now() - loginStartTime;
      tokenGenerationTime.add(tokenGenTime);
      
      try {
        const responseBody = JSON.parse(loginResponse.body);
        authenticatedUsers.push({
          token: responseBody.access_token,
          user: responseBody.user,
        });
      } catch (error) {
        console.error('Failed to parse login response:', error);
      }
    }

    // Simulate token refresh occasionally
    if (loginSuccess && Math.random() < 0.2) {
      refreshTokenFlow(JSON.parse(loginResponse.body).access_token);
    }
  });
}

// Registration flow function
function registrationFlow() {
  group('User Registration Flow', () => {
    const userData = generateTestUser();
    
    const registrationPayload = {
      fullname: userData.fullname,
      phone: userData.phone,
      email: userData.email,
      username: userData.username,
      password: userData.password,
      birthday: userData.birthday,
    };

    const registrationResponse = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify(registrationPayload),
      {
        ...httpOptions,
        tags: { endpoint: 'register' },
      }
    );

    const registrationSuccess = check(registrationResponse, {
      'registration status is 201': (r) => r.status === 201,
      'registration response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.access_token !== undefined;
        } catch {
          return false;
        }
      },
      'registration response has user data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.user && body.user.id !== undefined;
        } catch {
          return false;
        }
      },
      'registration response time < 300ms': (r) => r.timings.duration < 300,
    });

    registrationAttempts.add(1);
    authSuccessRate.add(registrationSuccess);
    
    if (registrationSuccess) {
      try {
        const responseBody = JSON.parse(registrationResponse.body);
        authenticatedUsers.push({
          token: responseBody.access_token,
          user: responseBody.user,
        });
      } catch (error) {
        console.error('Failed to parse registration response:', error);
      }
    }
  });
}

// Profile access flow function
function profileFlow() {
  group('Profile Access Flow', () => {
    // Use existing authenticated user or create new one
    let userToken = null;
    
    if (authenticatedUsers.length > 0) {
      const randomIndex = Math.floor(Math.random() * authenticatedUsers.length);
      userToken = authenticatedUsers[randomIndex].token;
    } else {
      // If no authenticated users, perform login first
      const credentials = generateLoginCredentials();
      const loginResponse = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({
          account: credentials.account,
          password: credentials.password,
        }),
        httpOptions
      );
      
      if (loginResponse.status === 200) {
        try {
          const responseBody = JSON.parse(loginResponse.body);
          userToken = responseBody.access_token;
        } catch (error) {
          console.error('Failed to parse login response for profile test:', error);
          return;
        }
      } else {
        return; // Skip profile test if login failed
      }
    }

    if (userToken) {
      const profileResponse = http.get(
        `${BASE_URL}/auth/profile`,
        {
          headers: {
            ...httpOptions.headers,
            'Authorization': `Bearer ${userToken}`,
          },
          tags: { endpoint: 'profile' },
        }
      );

      check(profileResponse, {
        'profile status is 200': (r) => r.status === 200,
        'profile response has user data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.id !== undefined;
          } catch {
            return false;
          }
        },
        'profile response time < 500ms': (r) => r.timings.duration < 500,
      });

      profileRequests.add(1);
    }
  });
}

// Token refresh flow function
function refreshTokenFlow(currentToken) {
  group('Token Refresh Flow', () => {
    const refreshResponse = http.post(
      `${BASE_URL}/auth/refresh`,
      JSON.stringify({}),
      {
        headers: {
          ...httpOptions.headers,
          'Authorization': `Bearer ${currentToken}`,
        },
        tags: { endpoint: 'refresh' },
      }
    );

    check(refreshResponse, {
      'refresh status is 200': (r) => r.status === 200,
      'refresh response has new token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.access_token !== undefined;
        } catch {
          return false;
        }
      },
      'refresh response time < 200ms': (r) => r.timings.duration < 200,
    });
  });
}

// Setup function (runs once per VU)
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log(`Test configuration: ${JSON.stringify(config.scenarios, null, 2)}`);
  
  // Health check
  const healthResponse = http.get(`${BASE_URL}/`);
  if (healthResponse.status !== 200) {
    console.warn(`Warning: Health check failed with status ${healthResponse.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total authenticated users created: ${authenticatedUsers.length}`);
  console.log(`Base URL tested: ${data.baseUrl}`);
}
