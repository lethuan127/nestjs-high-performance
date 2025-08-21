import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../auth/user.entity';
import configService from './config.service';

const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('POSTGRES_HOST', 'localhost'),
  port: configService.get('POSTGRES_PORT', 5432),
  username: configService.get('POSTGRES_USER', 'postgres'),
  password: configService.get('POSTGRES_PASSWORD', 'password'),
  database: configService.get('POSTGRES_DATABASE', 'cake_system'),
  entities: [User],
  migrations: ['../migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
  synchronize: false, // Always false for migrations
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('POSTGRES_SSL') ? { rejectUnauthorized: false } : false,
};

export default new DataSource(typeOrmConfig);
