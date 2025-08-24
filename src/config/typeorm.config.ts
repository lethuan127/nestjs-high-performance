import { DataSource, DataSourceOptions } from 'typeorm';
import configService from './config.service';
import { join } from 'path';

const entitiesPath = join(__dirname, '../**/*.entity.{ts,js}');
const migrationsPath = join(__dirname, '../migrations/**/*.{ts,js}');

const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('POSTGRES_HOST', 'localhost'),
  port: configService.get('POSTGRES_PORT', 5432),
  username: configService.get('POSTGRES_USER', 'postgres'),
  password: configService.get('POSTGRES_PASSWORD', 'password'),
  database: configService.get('POSTGRES_DATABASE', 'cake_system'),
  entities: [entitiesPath],
  migrations: [migrationsPath],
  migrationsTableName: 'migrations',
  synchronize: false, // Always false for migrations
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('POSTGRES_SSL') ? { rejectUnauthorized: false } : false,
  extra: {
    // Connection pool configuration optimized for 3 replicas
    max: 80, // Maximum connections per replica (3 replicas × 80 = 240 < 400 max_connections)
    min: 10, // Minimum connections per replica
    acquireTimeoutMillis: 30000, // Connection acquisition timeout
    idleTimeoutMillis: 30000, // Idle connection timeout
    reapIntervalMillis: 1000, // Cleanup interval
    createTimeoutMillis: 3000, // Connection creation timeout
    // Additional pool settings for better connection management
    evictionRunIntervalMillis: 10000, // Run eviction every 10 seconds
    numTestsPerEvictionRun: 3, // Test 3 connections per eviction run
    softIdleTimeoutMillis: 20000, // Soft idle timeout
    testOnBorrow: true, // Validate connections when borrowing
  },
};

export default new DataSource(typeOrmConfig);
