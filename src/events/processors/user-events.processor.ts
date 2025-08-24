import { Logger } from '@nestjs/common';
import { EventQueues, EventJobs } from '../events.interface';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(EventQueues.USER_EVENTS)
export class UserEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(UserEventsProcessor.name);

  constructor(private eventEmitter: EventEmitter2) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case EventJobs.USER_FIRST_LOGIN:
        await this.eventEmitter.emitAsync(EventJobs.USER_FIRST_LOGIN, job.data);
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
