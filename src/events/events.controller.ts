import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('admin/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('queue-stats')
  async getQueueStats() {
    return this.eventsService.getQueueStats();
  }

  @Post('retry-failed')
  @HttpCode(HttpStatus.OK)
  async retryFailedJobs() {
    return this.eventsService.retryFailedJobs();
  }
}
