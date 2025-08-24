import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import dataSource from './config/typeorm.config';
import configService from './config/config.service';
import { DataSource } from 'typeorm';
import LoggerMiddleware from './common/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => configService],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSource.options,
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options!);
        await dataSource.initialize();
        return dataSource;
      },
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).exclude({ path: 'health', method: RequestMethod.ALL }).forRoutes('*');
  }
}
