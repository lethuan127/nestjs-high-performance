import { Client } from 'pg';
import bcrypt from 'bcrypt';
import { generateUserInfo, DOMAINS, PASSWORDS } from './test-data.js';

// Configuration
const TOTAL_USERS = parseInt(process.env.TOTAL_USERS) || 1_000_000;
const BATCH_SIZE = 1_000; // Process in batches for memory efficiency (reduced to avoid parameter limits)
const SALT_ROUNDS = 10;

// Pre-hash common passwords for performance
const HASHED_PASSWORDS = new Map();

async function preHashPasswords() {
  console.log('Pre-hashing passwords...');
  
  for (const password of PASSWORDS) {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    HASHED_PASSWORDS.set(password, hashed);
  }
  console.log(`Pre-hashed ${PASSWORDS.length} passwords`);
}

function generateUser(index) {
  const userInfo = generateUserInfo(index);
  const hashedPassword = HASHED_PASSWORDS.get(userInfo.password);
  
  return {
    fullname: userInfo.fullname,
    username: userInfo.username,
    email: userInfo.email,
    phone: userInfo.phone,
    birthday: userInfo.birthday,
    password: hashedPassword,
    latestLogin: new Date().toISOString()
  };
}



async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cake_system',
    // Optimize for bulk operations
    connectionTimeoutMillis: 30000,
    query_timeout: 300000, // 5 minutes
  });
  
  await client.connect();
  return client;
}

async function clearExistingTestUsers(client) {
  console.log('Clearing existing test users...');
  
  // Delete users with test email domains
  const testDomains = DOMAINS.map(d => `'%${d}'`).join(',');
  const deleteQuery = `
    DELETE FROM users 
    WHERE email LIKE ANY(ARRAY[${testDomains}])
    OR username LIKE '%loadtest%'
    OR username LIKE '%k6test%'
  `;
  
  const result = await client.query(deleteQuery);
  console.log(`Deleted ${result.rowCount} existing test users`);
}

async function seedUsersBatch(client, startIndex, batchSize) {
  // Generate batch data
  const users = [];
  for (let i = 0; i < batchSize; i++) {
    users.push(generateUser(startIndex + i));
  }
  
  // Build bulk INSERT query with parameterized values
  const valueStrings = [];
  const values = [];
  let paramIndex = 1;
  
  for (const user of users) {
    valueStrings.push(
      `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`
    );
    values.push(
      user.fullname,
      user.username,
      user.email,
      user.phone,
      user.password,
      user.birthday,
      user.latestLogin
    );
    paramIndex += 7;
  }
  
  const insertQuery = `
    INSERT INTO users (fullname, username, email, phone, password, birthday, latest_login)
    VALUES ${valueStrings.join(', ')}
  `;
  
  await client.query(insertQuery, values);
}

async function seedUsers() {
  const startTime = Date.now();
  console.log(`Starting to seed ${TOTAL_USERS.toLocaleString()} users...`);
  
  let client;
  try {
    // Pre-hash passwords for performance
    await preHashPasswords();
    
    // Connect to database
    client = await getDbClient();
    console.log('Connected to database');
    
    // Clear existing test users
    await clearExistingTestUsers(client);

    // Begin transaction
    await client.query('BEGIN');
    
    // Seed users in batches
    console.log(`Seeding users in batches of ${BATCH_SIZE.toLocaleString()}...`);
    
    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
      const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_USERS - i);
      const batchStartTime = Date.now();
      
      await seedUsersBatch(client, i, currentBatchSize);
      
      const batchEndTime = Date.now();
      const batchDuration = (batchEndTime - batchStartTime) / 1000;
      const usersPerSecond = (currentBatchSize / batchDuration).toFixed(0);
      
      console.log(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(TOTAL_USERS / BATCH_SIZE)}: ` +
        `${(i + currentBatchSize).toLocaleString()}/${TOTAL_USERS.toLocaleString()} users ` +
        `(${usersPerSecond} users/sec)`
      );
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Transaction committed');
    
    // Analyze tables for query optimization
    await client.query('ANALYZE users');
    
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    const avgUsersPerSecond = (TOTAL_USERS / totalDuration).toFixed(0);
    
    console.log('\n✅ User seeding completed successfully!');
    console.log(`📊 Statistics:`);
    console.log(`   Total users: ${TOTAL_USERS.toLocaleString()}`);
    console.log(`   Total time: ${totalDuration.toFixed(2)} seconds`);
    console.log(`   Average speed: ${avgUsersPerSecond} users/second`);
    console.log(`   Batch size: ${BATCH_SIZE.toLocaleString()}`);
    
    // Verify the insert
    const countResult = await client.query('SELECT COUNT(*) FROM users');
    console.log(`   Verified count: ${parseInt(countResult.rows[0].count).toLocaleString()} users in database`);
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Export for use in other scripts
export { seedUsers, generateUser, TOTAL_USERS };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().then(() => {
    console.log('Seeding process completed');
    process.exit(0);
  }).catch(error => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  });
}
