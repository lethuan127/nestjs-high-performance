/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { EventsService } from './events.service';
import { EventQueues } from './events.interface';

describe('EventsService', () => {
  let service: EventsService;
  let userEventsQueue: any;
  let promotionEventsQueue: any;

  const mockQueue = {
    add: jest.fn(),
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getQueueToken(EventQueues.USER_EVENTS),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken(EventQueues.PROMOTION_EVENTS),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    userEventsQueue = module.get(getQueueToken(EventQueues.USER_EVENTS));
    promotionEventsQueue = module.get(getQueueToken(EventQueues.PROMOTION_EVENTS));

    jest.clearAllMocks();
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueue.getWaiting.mockResolvedValue([1, 2, 3]); // 3 waiting jobs
      mockQueue.getActive.mockResolvedValue([1]); // 1 active job
      mockQueue.getCompleted.mockResolvedValue([1, 2]); // 2 completed jobs
      mockQueue.getFailed.mockResolvedValue([]); // 0 failed jobs

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        userEvents: {
          waiting: 3,
          active: 1,
          completed: 2,
          failed: 0,
        },
        promotionEvents: {
          waiting: 3,
          active: 1,
          completed: 2,
          failed: 0,
        },
      });
    });
  });

  describe('retryFailedJobs', () => {
    it('should retry failed jobs successfully', async () => {
      const mockFailedJob = {
        id: 'job-123',
        queue: { name: 'user-events' },
        retry: jest.fn().mockResolvedValue(undefined),
      };

      mockQueue.getFailed.mockResolvedValue([mockFailedJob]);

      const result = await service.retryFailedJobs();

      expect(result.retriedCount).toBe(2); // Both queues have the same failed job
      expect(mockFailedJob.retry).toHaveBeenCalledTimes(2);
    });

    it('should handle retry failures gracefully', async () => {
      const mockFailedJob = {
        id: 'job-123',
        queue: { name: 'user-events' },
        retry: jest.fn().mockRejectedValue(new Error('Retry failed')),
      };

      mockQueue.getFailed.mockResolvedValue([mockFailedJob]);

      const result = await service.retryFailedJobs();

      expect(result.retriedCount).toBe(0);
      expect(mockFailedJob.retry).toHaveBeenCalledTimes(2);
    });
  });
});
