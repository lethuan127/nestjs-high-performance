import { Logger } from '@nestjs/common';
import { EventQueues, EventJobs } from '../events.interface';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(EventQueues.PROMOTION_EVENTS)
export class PromotionEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(PromotionEventsProcessor.name);

  constructor(private eventEmitter: EventEmitter2) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case EventJobs.PROMOTION_ENROLLMENT:
        await this.eventEmitter.emitAsync(EventJobs.PROMOTION_ENROLLMENT, job.data);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
