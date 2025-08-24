import { CampaignStatus, CampaignType } from '../entities/promotion-campaign.entity';
import { ParticipationStatus } from '../entities/user-promotion.entity';
import { VoucherStatus, VoucherType } from '../entities/voucher.entity';

export class CampaignResponseDto {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  discountPercentage: number;
  minTopupAmount: number;
  maxDiscountAmount?: number;
  voucherValidityDays: number;
  remainingSlots: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPromotionResponseDto {
  id: string;
  campaignId: string;
  campaignName: string;
  status: ParticipationStatus;
  firstLoginAt: Date;
  voucherIssuedAt?: Date;
  voucherUsedAt?: Date;
  participationOrder: number;
  isInFirstHundred: boolean;
  vouchers: VoucherResponseDto[];
  createdAt: Date;
}

export class VoucherResponseDto {
  id: string;
  code: string;
  type: VoucherType;
  status: VoucherStatus;
  discountPercentage: number;
  minTopupAmount: number;
  maxDiscountAmount?: number;
  issuedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  usedAmount?: number;
  discountAmount?: number;
  transactionReference?: string;
  isValid: boolean;
  isExpired: boolean;
}

export class PromotionEligibilityResponseDto {
  eligible: boolean;
  campaignId?: string;
  campaignName?: string;
  message: string;
  remainingSlots?: number;
  participationOrder?: number;
}
