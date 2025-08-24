import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PromotionsModule } from './promotions/promotions.module';
import { EventsModule } from './events/events.module';
import dataSource from './config/typeorm.config';
import configService from './config/config.service';
import { CacheModule } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import LoggerMiddleware from './common/logger.middleware';
import KeyvRedis from '@keyv/redis';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => configService],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          getTracker: (req) => (req.ips.length ? req.ips[0] : req.ip),
          ttl: 60000, // 1 minute
          limit: 100, // 100 requests
        },
      ],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSource.options,
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options!);
        await dataSource.initialize();
        return dataSource;
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        return {
          stores: [new KeyvRedis(configService.get('REDIS_URL'))],
        };
      },
      inject: [ConfigService],
    }),
    EventsModule,
    AuthModule,
    PromotionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).exclude({ path: 'health', method: RequestMethod.ALL }).forRoutes('*');
  }
}
