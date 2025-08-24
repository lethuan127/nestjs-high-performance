import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { EventsController } from './events.controller';
import { UserEventsProcessor } from './processors/user-events.processor';
import { EventQueues } from './events.interface';
import { createQueueConfig } from './queue.config';
import { PromotionsModule } from '../promotions/promotions.module';
import { RegisterQueueOptions } from '@nestjs/bullmq';
import { EventsService } from './events.service';

const queues = BullModule.registerQueue(
  ...Object.values(EventQueues).map(
    (x) =>
      ({
        name: x,
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: {
            age: 604800, // 7 days
            count: 100,
          },
        },
      }) as RegisterQueueOptions,
  ),
);

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => createQueueConfig(configService),
      inject: [ConfigService],
    }),
    queues,
    PromotionsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, UserEventsProcessor],
  exports: [queues, EventsService],
})
export class EventsModule {}
