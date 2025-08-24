const TOTAL_USERS = 1_000_000;

// Pre-computed data arrays for better performance
export const FIRST_NAMES = [
  'John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'James', 'Robert',
  'Michael', 'William', 'Richard', 'Joseph', 'Thomas', 'Jennifer', 'Linda', 'Elizabeth',
  'Barbara', 'Susan', 'Jessica', 'Karen', 'Nancy', 'Betty', 'Helen', 'Sandra', 'Donna',
  'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Emily', 'Kimberly', 'Deborah', 'Dorothy',
  'Amy', 'Angela', 'Ashley', 'Brenda', 'Patricia', 'Maria', 'Catherine', 'Frances', 'Christine'
];

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson',
  'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
  'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez',
  'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez',
  'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell'
];

export const DOMAINS = [
  'example.com', 'test.com', 'demo.org', 'sample.net', 'loadtest.org', 'k6test.com',
  'perftest.net', 'benchmark.org', 'testdata.com', 'mockuser.org'
];

export const AREA_CODES = [
  '201', '202', '203', '212', '213', '214', '215', '216', '217', '218', '219', '224',
  '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254'
];

export const PASSWORDS = [
  'TestPassword123!', 'LoadTest2024$', 'K6Testing%^&', 'AuthTest123*',
  'UserPass456+', 'SecurePass789@', 'StrongPwd456#', 'BenchMark789!'
];

export function generateUserInfo(index) {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const domain = DOMAINS[index % DOMAINS.length];
  const areaCode = AREA_CODES[index % AREA_CODES.length];
  
  // Generate deterministic but unique data
  const userSuffix = index.toString().padStart(7, '0');
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${userSuffix}`;
  const email = `${username}@${domain}`;
  
  // Generate phone number (ensure uniqueness by using index directly)
  const phoneIndex = index % 9999999; // Ensure we don't exceed phone number limits
  const exchange = (200 + Math.floor(phoneIndex / 10000)).toString().padStart(3, '0');
  const number = (phoneIndex % 10000).toString().padStart(4, '0');
  const phone = `+1${areaCode}${exchange}${number}`;
  
  // Generate birthday (1970-2005)
  const birthYear = 1970 + (index % 36);
  const birthMonth = (index % 12) + 1;
  const birthDay = (index % 28) + 1;
  const birthday = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
  
  // Select password
  const passwordIndex = index % 8;
  const password = PASSWORDS[passwordIndex];

  return {
    fullname: `${firstName} ${lastName}`,
    username,
    email,
    phone,
    birthday,
    password,
  };
}


export function generateTestUser() {
  return generateUserInfo(Math.floor(Math.random() * TOTAL_USERS) + TOTAL_USERS);
}

// Generate login credentials (mix of existing and new users)
export function generateLoginCredentials() {
  const user = generateUserInfo(Math.floor(Math.random() * TOTAL_USERS));
  const accountType = Math.random();

  let account;
  if (accountType < 0.4) {
    account = user.username; // 40% username
  } else if (accountType < 0.8) {
    account = user.email; // 40% email
  } else {
    account = user.phone; // 20% phone
  }

  return {
    valid: true,
    account: account,
    password: user.password,
  };
}

// Generate realistic user agent strings
export function generateUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Generate random IP addresses for testing
export function generateRandomIP() {
  const generateOctet = () => Math.floor(Math.random() * 256);
  return `${generateOctet()}.${generateOctet()}.${generateOctet()}.${generateOctet()}`;
}

// Data validation utilities
export function validateUserData(user) {
  const errors = [];

  if (!user.fullname || user.fullname.length < 2) {
    errors.push('Invalid fullname');
  }

  if (!user.username || user.username.length < 3) {
    errors.push('Invalid username');
  }

  if (!user.email || !isValidEmail(user.email)) {
    errors.push('Invalid email');
  }

  if (!user.phone || !isValidPhone(user.phone)) {
    errors.push('Invalid phone');
  }

  if (!user.password || user.password.length < 6) {
    errors.push('Invalid password');
  }

  if (!user.birthday || !isValidDate(user.birthday)) {
    errors.push('Invalid birthday');
  }

  return errors;
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation
function isValidPhone(phone) {
  const phoneRegex = /^\+1\d{10}$/;
  return phoneRegex.test(phone);
}

// Date validation
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Performance monitoring data
export function generatePerformanceMetrics() {
  return {
    timestamp: Date.now(),
    memoryUsage: Math.random() * 100, // Simulated memory usage %
    cpuUsage: Math.random() * 100, // Simulated CPU usage %
    responseTime: Math.random() * 2000 + 100, // 100-2100ms
    throughput: Math.random() * 1000 + 500, // 500-1500 RPS
  };
}

// Export statistics
export function getTestDataStats() {
  return {
    totalPreGeneratedUsers: testUsers.length,
    availableFirstNames: firstNames.length,
    availableLastNames: lastNames.length,
    availableDomains: domains.length,
    estimatedCombinations: firstNames.length * lastNames.length * domains.length,
  };
}
