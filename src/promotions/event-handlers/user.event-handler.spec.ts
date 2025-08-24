/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UserEventHandler } from './user.event-handler';
import { PromotionsService } from '../promotions.service';
import { UserFirstLoginEvent } from '../../events/events.interface';

describe('UserEventHandler', () => {
  let handler: UserEventHandler;
  let promotionsService: PromotionsService;

  const mockPromotionsService = {
    trackFirstLogin: jest.fn(),
    getUserVouchers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEventHandler,
        {
          provide: PromotionsService,
          useValue: mockPromotionsService,
        },
      ],
    }).compile();

    handler = module.get<UserEventHandler>(UserEventHandler);
    promotionsService = module.get<PromotionsService>(PromotionsService);

    jest.clearAllMocks();
  });

  describe('handleUserFirstLogin', () => {
    const mockEvent: UserFirstLoginEvent = {
      userId: '1',
      fullname: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      phone: '+1234567890',
      loginTimestamp: new Date(),
    };

    it('should process first login event successfully with voucher', async () => {
      const promotionResult = {
        eligible: true,
        campaignId: 'campaign-1',
        campaignName: 'First Login Promotion',
        message: 'Congratulations! You are participant #50.',
        participationOrder: 50,
        remainingSlots: 50,
      };

      const vouchers = [
        {
          id: '1',
          code: 'CAKE-12345678',
          status: 'active',
          discountPercentage: 30,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ];

      mockPromotionsService.trackFirstLogin.mockResolvedValue(promotionResult);
      mockPromotionsService.getUserVouchers.mockResolvedValue(vouchers);

      await handler.handleUserFirstLogin(mockEvent);

      expect(mockPromotionsService.trackFirstLogin).toHaveBeenCalledWith('1');
      expect(mockPromotionsService.getUserVouchers).toHaveBeenCalledWith('1');
    });

    it('should process first login event successfully without voucher (beyond first 100)', async () => {
      const promotionResult = {
        eligible: true,
        campaignId: 'campaign-1',
        campaignName: 'First Login Promotion',
        message: 'You are participant #150.',
        participationOrder: 150,
        remainingSlots: 0,
      };

      mockPromotionsService.trackFirstLogin.mockResolvedValue(promotionResult);

      await handler.handleUserFirstLogin(mockEvent);

      expect(mockPromotionsService.trackFirstLogin).toHaveBeenCalledWith('1');
      expect(mockPromotionsService.getUserVouchers).not.toHaveBeenCalled();
    });

    it('should process first login event when not eligible', async () => {
      const promotionResult = {
        eligible: false,
        message: 'No active promotion campaigns available',
      };

      mockPromotionsService.trackFirstLogin.mockResolvedValue(promotionResult);

      await handler.handleUserFirstLogin(mockEvent);

      expect(mockPromotionsService.trackFirstLogin).toHaveBeenCalledWith('1');
      expect(mockPromotionsService.getUserVouchers).not.toHaveBeenCalled();
    });

    it('should handle voucher retrieval errors gracefully', async () => {
      const promotionResult = {
        eligible: true,
        campaignId: 'campaign-1',
        campaignName: 'First Login Promotion',
        message: 'Congratulations! You are participant #50.',
        participationOrder: 50,
        remainingSlots: 50,
      };

      mockPromotionsService.trackFirstLogin.mockResolvedValue(promotionResult);
      mockPromotionsService.getUserVouchers.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await handler.handleUserFirstLogin(mockEvent);

      expect(mockPromotionsService.trackFirstLogin).toHaveBeenCalledWith('1');
      expect(mockPromotionsService.getUserVouchers).toHaveBeenCalledWith('1');
    });

    it('should handle promotion service errors gracefully', async () => {
      mockPromotionsService.trackFirstLogin.mockRejectedValue(new Error('Promotion service error'));

      // Should not throw - error should be logged but not propagated
      await handler.handleUserFirstLogin(mockEvent);

      expect(mockPromotionsService.trackFirstLogin).toHaveBeenCalledWith('1');
      expect(mockPromotionsService.getUserVouchers).not.toHaveBeenCalled();
    });
  });
});
