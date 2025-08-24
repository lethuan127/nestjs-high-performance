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
};

export default new DataSource(typeOrmConfig);
