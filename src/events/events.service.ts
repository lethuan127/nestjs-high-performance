import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { EventJobs, EventQueues } from './events.interface';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectQueue(EventQueues.USER_EVENTS) private userEventsQueue: Queue,
    @InjectQueue(EventQueues.PROMOTION_EVENTS) private promotionEventsQueue: Queue,
  ) {}

  /**
   * Publishes a user event asynchronously to the user events queue.
   * @param name - The name of the event job to publish.
   * @param event - The event payload to be added to the queue.
   */
  async publishUserEventAsync<T>(name: EventJobs, event: T): Promise<void> {
    try {
      await this.userEventsQueue.add(name, event);
      this.logger.log(`User event ${name} published`);
    } catch (error) {
      this.logger.error(`Error publishing user event ${name}`, {
        error: (error as Error).message,
        event,
      });
    }
  }

  /**
   * Publishes a promotion event asynchronously to the promotion events queue.
   * @param name - The name of the event job to publish.
   * @param event - The event payload to be added to the queue.
   */
  async publishPromotionEventAsync<T>(name: EventJobs, event: T): Promise<void> {
    try {
      await this.promotionEventsQueue.add(name, event);
      this.logger.log(`Promotion event ${name} published`);
    } catch (error) {
      this.logger.error(`Error publishing promotion event ${name}`, {
        error: (error as Error).message,
        event,
      });
    }
  }

  async getQueueStats(): Promise<{
    userEvents: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    promotionEvents: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const [userEventsStats, promotionEventsStats] = await Promise.all([
      Promise.all([this.userEventsQueue.getWaiting(), this.userEventsQueue.getActive(), this.userEventsQueue.getCompleted(), this.userEventsQueue.getFailed()]),
      Promise.all([
        this.promotionEventsQueue.getWaiting(),
        this.promotionEventsQueue.getActive(),
        this.promotionEventsQueue.getCompleted(),
        this.promotionEventsQueue.getFailed(),
      ]),
    ]);

    return {
      userEvents: {
        waiting: userEventsStats[0].length,
        active: userEventsStats[1].length,
        completed: userEventsStats[2].length,
        failed: userEventsStats[3].length,
      },
      promotionEvents: {
        waiting: promotionEventsStats[0].length,
        active: promotionEventsStats[1].length,
        completed: promotionEventsStats[2].length,
        failed: promotionEventsStats[3].length,
      },
    };
  }

  async retryFailedJobs(): Promise<{ retriedCount: number }> {
    const [userEventsFailed, promotionEventsFailed] = await Promise.all([this.userEventsQueue.getFailed(), this.promotionEventsQueue.getFailed()]);

    const allFailedJobs = [...(userEventsFailed as Job<unknown>[]), ...(promotionEventsFailed as Job<unknown>[])];
    let retriedCount = 0;

    for (const job of allFailedJobs) {
      try {
        await job.retry();
        retriedCount++;
        this.logger.log(`Retried failed job ${job.id} from queue ${job.queueName}`);
      } catch (error) {
        this.logger.error(`Failed to retry job ${job.id}`, {
          error: (error as Error).message,
          jobId: job.id,
          queueName: job.queueName,
        });
      }
    }

    return { retriedCount };
  }
}
