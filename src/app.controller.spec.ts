import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AppController', () => {
  let appController: AppController;

  const mockDataSource = {
    query: jest.fn().mockResolvedValue([{ '1': 1 }]),
  };

  const mockCacheManager = {
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue('test'),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      const result = await appController.getHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('memory');

      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('cache');

      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockCacheManager.set).toHaveBeenCalledWith('test', 'test', 1000);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test');
    });

    it('should handle errors and return unhealthy status', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await appController.getHealth();

      expect(result.status).toBe('unhealthy');
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Database connection failed');
    });
  });
});
