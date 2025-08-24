import { Controller, Get, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const startTime = Date.now();

    try {
      // Check database connectivity
      await this.dataSource.query('SELECT 1');
      const dbStatus = 'healthy';

      await this.cacheManager.set('test', 'test', 1000);
      await this.cacheManager.get('test');
      const cacheStatus = 'healthy';

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryStatus = memoryUsage.heapUsed < 1.5 * 1024 * 1024 * 1024 ? 'healthy' : 'warning'; // 1.5GB threshold

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime,
        checks: {
          database: dbStatus,
          memory: memoryStatus,
          cache: cacheStatus,
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
