import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PromotionCampaign, CampaignStatus, CampaignType } from './entities/promotion-campaign.entity';
import { UserPromotion, ParticipationStatus } from './entities/user-promotion.entity';
import { Voucher, VoucherStatus, VoucherType } from './entities/voucher.entity';
import { User } from '../auth/user.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { TopupRequestDto, TopupResponseDto } from './dto/topup-request.dto';
import { CampaignResponseDto, UserPromotionResponseDto, VoucherResponseDto, PromotionEligibilityResponseDto } from './dto/promotion-response.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(PromotionCampaign)
    private campaignRepository: Repository<PromotionCampaign>,
    @InjectRepository(UserPromotion)
    private userPromotionRepository: Repository<UserPromotion>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // Campaign Management
  async createCampaign(createCampaignDto: CreateCampaignDto): Promise<CampaignResponseDto> {
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      startDate: new Date(createCampaignDto.startDate),
      endDate: new Date(createCampaignDto.endDate),
    });

    const savedCampaign = await this.campaignRepository.save(campaign);
    return this.mapCampaignToResponse(savedCampaign);
  }

  async getActiveCampaigns(): Promise<CampaignResponseDto[]> {
    const campaigns = await this.campaignRepository.find({
      where: { status: CampaignStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    return campaigns.map((campaign) => this.mapCampaignToResponse(campaign));
  }

  async getCampaignById(id: string): Promise<CampaignResponseDto> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return this.mapCampaignToResponse(campaign);
  }

  // User Promotion Tracking
  async trackFirstLogin(userId: string): Promise<PromotionEligibilityResponseDto> {
    // Check if user already has a promotion record
    const existingPromotion = await this.userPromotionRepository.findOne({
      where: { userId },
      relations: ['campaign'],
    });

    if (existingPromotion) {
      return {
        eligible: false,
        message: 'User has already participated in a promotion campaign',
      };
    }

    // Find active campaign
    const activeCampaign = await this.campaignRepository.findOne({
      where: {
        status: CampaignStatus.ACTIVE,
        type: CampaignType.FIRST_LOGIN_DISCOUNT,
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeCampaign || !activeCampaign.isEligibleForNewParticipants()) {
      return {
        eligible: false,
        message: 'No active promotion campaigns available or campaign is full',
      };
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get current participant count with lock
      const currentCampaign = await queryRunner.manager.findOne(PromotionCampaign, {
        where: { id: activeCampaign.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!currentCampaign || currentCampaign.currentParticipants >= currentCampaign.maxParticipants) {
        await queryRunner.rollbackTransaction();
        return {
          eligible: false,
          message: 'Campaign is full',
        };
      }

      // Create user promotion record
      const participationOrder = currentCampaign.currentParticipants + 1;
      const userPromotion = queryRunner.manager.create(UserPromotion, {
        userId,
        campaignId: activeCampaign.id,
        status: ParticipationStatus.ELIGIBLE,
        firstLoginAt: new Date(),
        participationOrder,
      });

      await queryRunner.manager.save(userPromotion);

      // Update campaign participant count
      await queryRunner.manager.update(PromotionCampaign, activeCampaign.id, {
        currentParticipants: participationOrder,
        status: participationOrder >= currentCampaign.maxParticipants ? CampaignStatus.FULL : CampaignStatus.ACTIVE,
      });

      // Issue voucher if user is in first 100
      if (participationOrder <= 100) {
        await this.issueVoucherForUser(queryRunner.manager, userPromotion, activeCampaign);
      }

      await queryRunner.commitTransaction();

      return {
        eligible: true,
        campaignId: activeCampaign.id,
        campaignName: activeCampaign.name,
        message:
          participationOrder <= 100
            ? `Congratulations! You're participant #${participationOrder}. Your discount voucher has been issued.`
            : `You're participant #${participationOrder}. Unfortunately, vouchers are only available for the first 100 participants.`,
        remainingSlots: Math.max(0, activeCampaign.maxParticipants - participationOrder),
        participationOrder,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async issueVoucherForUser(manager: EntityManager, userPromotion: UserPromotion, campaign: PromotionCampaign): Promise<void> {
    const voucherCode = this.generateVoucherCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + campaign.voucherValidityDays);

    const voucher = manager.create(Voucher, {
      code: voucherCode,
      userPromotionId: userPromotion.id,
      type: VoucherType.MOBILE_TOPUP_DISCOUNT,
      status: VoucherStatus.ACTIVE,
      discountPercentage: campaign.discountPercentage,
      minTopupAmount: campaign.minTopupAmount,
      maxDiscountAmount: campaign.maxDiscountAmount,
      issuedAt: new Date(),
      expiresAt,
    });

    await manager.save(voucher);

    // Update user promotion status
    await manager.update(UserPromotion, userPromotion.id, {
      status: ParticipationStatus.VOUCHER_ISSUED,
      voucherIssuedAt: new Date(),
    });
  }

  // Voucher Management
  async getUserVouchers(userId: string): Promise<VoucherResponseDto[]> {
    const vouchers = await this.voucherRepository
      .createQueryBuilder('voucher')
      .innerJoin('voucher.userPromotion', 'userPromotion')
      .where('userPromotion.userId = :userId', { userId })
      .orderBy('voucher.createdAt', 'DESC')
      .getMany();

    return vouchers.map((voucher) => this.mapVoucherToResponse(voucher));
  }

  async validateVoucher(voucherCode: string): Promise<VoucherResponseDto> {
    const voucher = await this.voucherRepository.findOne({
      where: { code: voucherCode },
      relations: ['userPromotion'],
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    // Update expired vouchers
    if (voucher.isExpired() && voucher.status === VoucherStatus.ACTIVE) {
      voucher.status = VoucherStatus.EXPIRED;
      await this.voucherRepository.save(voucher);
    }

    return this.mapVoucherToResponse(voucher);
  }

  // Mobile Top-up with Discount
  async processTopup(userId: string, topupRequest: TopupRequestDto): Promise<TopupResponseDto> {
    let discountAmount = 0;
    const voucherCode = topupRequest.voucherCode;
    let voucher: Voucher | null = null;

    // If voucher code provided, validate and apply discount
    if (voucherCode) {
      voucher = await this.voucherRepository.findOne({
        where: { code: voucherCode },
        relations: ['userPromotion'],
      });

      if (!voucher) {
        throw new NotFoundException('Invalid voucher code');
      }

      if (voucher.userPromotion.userId !== userId) {
        throw new BadRequestException('Voucher does not belong to this user');
      }

      if (!voucher.isValid()) {
        throw new BadRequestException('Voucher is expired or already used');
      }

      if (topupRequest.amount < voucher.minTopupAmount) {
        throw new BadRequestException(`Minimum top-up amount for this voucher is ${voucher.minTopupAmount}`);
      }

      discountAmount = voucher.calculateDiscount(topupRequest.amount);
    }

    const finalAmount = topupRequest.amount - discountAmount;
    const transactionId = this.generateTransactionId();

    // Simulate payment processing
    const paymentSuccess = await this.processPayment(topupRequest.phoneNumber, finalAmount, transactionId);

    if (!paymentSuccess) {
      throw new BadRequestException('Payment processing failed');
    }

    // If voucher was used, mark it as used
    if (voucher && discountAmount > 0) {
      voucher.status = VoucherStatus.USED;
      voucher.usedAt = new Date();
      voucher.usedAmount = topupRequest.amount;
      voucher.discountAmount = discountAmount;
      voucher.transactionReference = transactionId;
      await this.voucherRepository.save(voucher);

      // Update user promotion status
      await this.userPromotionRepository.update(voucher.userPromotionId, {
        status: ParticipationStatus.VOUCHER_USED,
        voucherUsedAt: new Date(),
      });
    }

    return {
      success: true,
      transactionId,
      originalAmount: topupRequest.amount,
      discountAmount,
      finalAmount,
      phoneNumber: topupRequest.phoneNumber,
      voucherCode: voucherCode,
      message: discountAmount > 0 ? `Top-up successful! You saved ${discountAmount} with your voucher.` : 'Top-up successful!',
    };
  }

  // User Promotion History
  async getUserPromotions(userId: string): Promise<UserPromotionResponseDto[]> {
    const userPromotions = await this.userPromotionRepository.find({
      where: { userId },
      relations: ['campaign', 'vouchers'],
      order: { createdAt: 'DESC' },
    });

    return userPromotions.map((up) => ({
      id: up.id,
      campaignId: up.campaignId,
      campaignName: up.campaign.name,
      status: up.status,
      firstLoginAt: up.firstLoginAt,
      voucherIssuedAt: up.voucherIssuedAt,
      voucherUsedAt: up.voucherUsedAt,
      participationOrder: up.participationOrder,
      isInFirstHundred: up.isInFirstHundred(),
      vouchers: up.vouchers.map((v) => this.mapVoucherToResponse(v)),
      createdAt: up.createdAt,
    }));
  }

  // Helper Methods
  private generateVoucherCode(): string {
    return `CAKE-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  private async processPayment(phoneNumber: string, amount: number, transactionId: string): Promise<boolean> {
    // Simulate payment processing - replace with actual payment gateway integration
    // This would typically involve calling a payment service or bank API
    console.log(`Processing payment: ${amount} for ${phoneNumber}, transaction: ${transactionId}`);

    // Simulate some processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate 95% success rate
    return Math.random() > 0.05;
  }

  private mapCampaignToResponse(campaign: PromotionCampaign): CampaignResponseDto {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      maxParticipants: campaign.maxParticipants,
      currentParticipants: campaign.currentParticipants,
      discountPercentage: campaign.discountPercentage,
      minTopupAmount: campaign.minTopupAmount,
      maxDiscountAmount: campaign.maxDiscountAmount,
      voucherValidityDays: campaign.voucherValidityDays,
      remainingSlots: campaign.getRemainingSlots(),
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  private mapVoucherToResponse(voucher: Voucher): VoucherResponseDto {
    return {
      id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      status: voucher.status,
      discountPercentage: voucher.discountPercentage,
      minTopupAmount: voucher.minTopupAmount,
      maxDiscountAmount: voucher.maxDiscountAmount,
      issuedAt: voucher.issuedAt,
      expiresAt: voucher.expiresAt,
      usedAt: voucher.usedAt,
      usedAmount: voucher.usedAmount,
      discountAmount: voucher.discountAmount,
      transactionReference: voucher.transactionReference,
      isValid: voucher.isValid(),
      isExpired: voucher.isExpired(),
    };
  }
}
