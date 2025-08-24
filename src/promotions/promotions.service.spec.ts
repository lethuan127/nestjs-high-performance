/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PromotionsService } from './promotions.service';
import { PromotionCampaign, CampaignStatus, CampaignType } from './entities/promotion-campaign.entity';
import { UserPromotion, ParticipationStatus } from './entities/user-promotion.entity';
import { Voucher, VoucherStatus, VoucherType } from './entities/voucher.entity';
import { User } from '../auth/user.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { TopupRequestDto } from './dto/topup-request.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let campaignRepository: Repository<PromotionCampaign>;
  let userPromotionRepository: Repository<UserPromotion>;
  let voucherRepository: Repository<Voucher>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockCampaignRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserPromotionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockVoucherRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        {
          provide: getRepositoryToken(PromotionCampaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(UserPromotion),
          useValue: mockUserPromotionRepository,
        },
        {
          provide: getRepositoryToken(Voucher),
          useValue: mockVoucherRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
    campaignRepository = module.get<Repository<PromotionCampaign>>(getRepositoryToken(PromotionCampaign));
    userPromotionRepository = module.get<Repository<UserPromotion>>(getRepositoryToken(UserPromotion));
    voucherRepository = module.get<Repository<Voucher>>(getRepositoryToken(Voucher));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a new campaign successfully', async () => {
      const createCampaignDto: CreateCampaignDto = {
        name: 'First Login Promotion',
        description: 'Get 30% discount on first mobile top-up',
        type: CampaignType.FIRST_LOGIN_DISCOUNT,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.999Z',
        maxParticipants: 100,
        discountPercentage: 30,
        minTopupAmount: 0,
        voucherValidityDays: 30,
      };

      const mockCampaign = {
        id: '1',
        ...createCampaignDto,
        startDate: new Date(createCampaignDto.startDate),
        endDate: new Date(createCampaignDto.endDate),
        status: CampaignStatus.ACTIVE,
        currentParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        getRemainingSlots: () => 100,
      };

      mockCampaignRepository.create.mockReturnValue(mockCampaign);
      mockCampaignRepository.save.mockResolvedValue(mockCampaign);

      const result = await service.createCampaign(createCampaignDto);

      expect(mockCampaignRepository.create).toHaveBeenCalledWith({
        ...createCampaignDto,
        startDate: new Date(createCampaignDto.startDate),
        endDate: new Date(createCampaignDto.endDate),
      });
      expect(mockCampaignRepository.save).toHaveBeenCalledWith(mockCampaign);
      expect(result.name).toBe(createCampaignDto.name);
      expect(result.remainingSlots).toBe(100);
    });
  });

  describe('trackFirstLogin', () => {
    it('should return not eligible if user already has a promotion', async () => {
      const userId = '1';
      const existingPromotion = {
        id: '1',
        userId,
        campaignId: '1',
        status: ParticipationStatus.VOUCHER_ISSUED,
      };

      mockUserPromotionRepository.findOne.mockResolvedValue(existingPromotion);

      const result = await service.trackFirstLogin(userId);

      expect(result.eligible).toBe(false);
      expect(result.message).toBe('User has already participated in a promotion campaign');
    });

    it('should return not eligible if no active campaign', async () => {
      const userId = '1';

      mockUserPromotionRepository.findOne.mockResolvedValue(null);
      mockCampaignRepository.findOne.mockResolvedValue(null);

      const result = await service.trackFirstLogin(userId);

      expect(result.eligible).toBe(false);
      expect(result.message).toBe('No active promotion campaigns available or campaign is full');
    });

    it('should successfully enroll user in first 100 and issue voucher', async () => {
      const userId = '1';
      const mockCampaign = {
        id: '1',
        name: 'First Login Promotion',
        maxParticipants: 100,
        currentParticipants: 50,
        discountPercentage: 30,
        minTopupAmount: 0,
        voucherValidityDays: 30,
        isEligibleForNewParticipants: () => true,
      };

      const mockUserPromotion = {
        id: '1',
        userId,
        campaignId: '1',
        status: ParticipationStatus.ELIGIBLE,
        firstLoginAt: new Date(),
        participationOrder: 51,
      };

      mockUserPromotionRepository.findOne.mockResolvedValue(null);
      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockQueryRunner.manager.findOne.mockResolvedValue(mockCampaign);
      mockQueryRunner.manager.create.mockReturnValue(mockUserPromotion);
      mockQueryRunner.manager.save.mockResolvedValue(mockUserPromotion);

      const result = await service.trackFirstLogin(userId);

      expect(result.eligible).toBe(true);
      expect(result.participationOrder).toBe(51);
      expect(result.message).toContain('Congratulations!');
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should enroll user but not issue voucher if beyond first 100', async () => {
      const userId = '1';
      const mockCampaign = {
        id: '1',
        name: 'First Login Promotion',
        maxParticipants: 200,
        currentParticipants: 150,
        discountPercentage: 30,
        minTopupAmount: 0,
        voucherValidityDays: 30,
        isEligibleForNewParticipants: () => true,
      };

      const mockUserPromotion = {
        id: '1',
        userId,
        campaignId: '1',
        status: ParticipationStatus.ELIGIBLE,
        firstLoginAt: new Date(),
        participationOrder: 151,
      };

      mockUserPromotionRepository.findOne.mockResolvedValue(null);
      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockQueryRunner.manager.findOne.mockResolvedValue(mockCampaign);
      mockQueryRunner.manager.create.mockReturnValue(mockUserPromotion);
      mockQueryRunner.manager.save.mockResolvedValue(mockUserPromotion);

      const result = await service.trackFirstLogin(userId);

      expect(result.eligible).toBe(true);
      expect(result.participationOrder).toBe(151);
      expect(result.message).toContain('Unfortunately, vouchers are only available');
    });
  });

  describe('validateVoucher', () => {
    it('should throw NotFoundException for invalid voucher code', async () => {
      mockVoucherRepository.findOne.mockResolvedValue(null);

      await expect(service.validateVoucher('INVALID-CODE')).rejects.toThrow(NotFoundException);
    });

    it('should return voucher details for valid code', async () => {
      const mockVoucher = {
        id: '1',
        code: 'CAKE-12345678',
        type: VoucherType.MOBILE_TOPUP_DISCOUNT,
        status: VoucherStatus.ACTIVE,
        discountPercentage: 30,
        minTopupAmount: 0,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isValid: () => true,
        isExpired: () => false,
      };

      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);

      const result = await service.validateVoucher('CAKE-12345678');

      expect(result.code).toBe('CAKE-12345678');
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('should update expired voucher status', async () => {
      const mockVoucher = {
        id: '1',
        code: 'CAKE-12345678',
        status: VoucherStatus.ACTIVE,
        isValid: () => false,
        isExpired: () => true,
      };

      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);
      mockVoucherRepository.save.mockResolvedValue({
        ...mockVoucher,
        status: VoucherStatus.EXPIRED,
      });

      const result = await service.validateVoucher('CAKE-12345678');

      expect(mockVoucherRepository.save).toHaveBeenCalledWith({
        ...mockVoucher,
        status: VoucherStatus.EXPIRED,
      });
    });
  });

  describe('processTopup', () => {
    it('should process topup without voucher successfully', async () => {
      const userId = '1';
      const topupRequest: TopupRequestDto = {
        phoneNumber: '+1234567890',
        amount: 100,
        paymentMethod: 'bank_transfer',
      };

      // Mock payment processing success
      jest.spyOn(service as any, 'processPayment').mockResolvedValue(true);

      const result = await service.processTopup(userId, topupRequest);

      expect(result.success).toBe(true);
      expect(result.originalAmount).toBe(100);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(100);
      expect(result.message).toBe('Top-up successful!');
    });

    it('should process topup with voucher and apply discount', async () => {
      const userId = '1';
      const topupRequest: TopupRequestDto = {
        phoneNumber: '+1234567890',
        amount: 100,
        voucherCode: 'CAKE-12345678',
        paymentMethod: 'bank_transfer',
      };

      const mockVoucher = {
        id: '1',
        code: 'CAKE-12345678',
        userPromotionId: '1',
        userPromotion: { userId },
        status: VoucherStatus.ACTIVE,
        minTopupAmount: 0,
        isValid: () => true,
        calculateDiscount: (amount: number) => amount * 0.3, // 30% discount
      };

      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);
      mockVoucherRepository.save.mockResolvedValue({
        ...mockVoucher,
        status: VoucherStatus.USED,
      });
      mockUserPromotionRepository.update.mockResolvedValue({});

      // Mock payment processing success
      jest.spyOn(service as any, 'processPayment').mockResolvedValue(true);

      const result = await service.processTopup(userId, topupRequest);

      expect(result.success).toBe(true);
      expect(result.originalAmount).toBe(100);
      expect(result.discountAmount).toBe(30);
      expect(result.finalAmount).toBe(70);
      expect(result.voucherCode).toBe('CAKE-12345678');
      expect(result.message).toContain('You saved 30 with your voucher');
    });

    it('should throw NotFoundException for invalid voucher', async () => {
      const userId = '1';
      const topupRequest: TopupRequestDto = {
        phoneNumber: '+1234567890',
        amount: 100,
        voucherCode: 'INVALID-CODE',
      };

      mockVoucherRepository.findOne.mockResolvedValue(null);

      await expect(service.processTopup(userId, topupRequest)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for voucher belonging to different user', async () => {
      const userId = '1';
      const topupRequest: TopupRequestDto = {
        phoneNumber: '+1234567890',
        amount: 100,
        voucherCode: 'CAKE-12345678',
      };

      const mockVoucher = {
        userPromotion: { userId: '2' }, // Different user
        isValid: () => true,
      };

      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);

      await expect(service.processTopup(userId, topupRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired voucher', async () => {
      const userId = '1';
      const topupRequest: TopupRequestDto = {
        phoneNumber: '+1234567890',
        amount: 100,
        voucherCode: 'CAKE-12345678',
      };

      const mockVoucher = {
        userPromotion: { userId },
        isValid: () => false,
      };

      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);

      await expect(service.processTopup(userId, topupRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for insufficient topup amount', async () => {
      const userId = '1';
      const topupRequest: TopupRequestDto = {
        phoneNumber: '+1234567890',
        amount: 10,
        voucherCode: 'CAKE-12345678',
      };

      const mockVoucher = {
        userPromotion: { userId },
        minTopupAmount: 50,
        isValid: () => true,
      };

      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);

      await expect(service.processTopup(userId, topupRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment fails', async () => {
      const userId = '1';
      const topupRequest: TopupRequestDto = {
        phoneNumber: '+1234567890',
        amount: 100,
      };

      // Mock payment processing failure
      jest.spyOn(service as any, 'processPayment').mockResolvedValue(false);

      await expect(service.processTopup(userId, topupRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserVouchers', () => {
    it('should return user vouchers', async () => {
      const userId = '1';
      const mockVouchers = [
        {
          id: '1',
          code: 'CAKE-12345678',
          type: VoucherType.MOBILE_TOPUP_DISCOUNT,
          status: VoucherStatus.ACTIVE,
          isValid: () => true,
          isExpired: () => false,
        },
      ];

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockVouchers),
      };

      mockVoucherRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserVouchers(userId);

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('CAKE-12345678');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('userPromotion.userId = :userId', { userId });
    });
  });
});
