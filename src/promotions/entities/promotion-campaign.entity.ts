import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { IsNotEmpty, IsOptional, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { UserPromotion } from './user-promotion.entity';

export enum CampaignStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  FULL = 'full',
}

export enum CampaignType {
  FIRST_LOGIN_DISCOUNT = 'first_login_discount',
}

@Entity('promotion_campaigns')
@Index('idx_campaigns_status', ['status'])
@Index('idx_campaigns_active_period', ['startDate', 'endDate', 'status'])
@Index('idx_campaigns_type', ['type'])
export class PromotionCampaign {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'enum', enum: CampaignType, default: CampaignType.FIRST_LOGIN_DISCOUNT })
  @IsEnum(CampaignType)
  type: CampaignType;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.ACTIVE })
  @IsEnum(CampaignStatus)
  status: CampaignStatus;

  @Column({ name: 'start_date', type: 'timestamp' })
  @IsDateString()
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  @IsDateString()
  endDate: Date;

  @Column({ name: 'max_participants', type: 'integer', default: 100 })
  @Min(1)
  @Max(10000)
  maxParticipants: number;

  @Column({ name: 'current_participants', type: 'integer', default: 0 })
  currentParticipants: number;

  @Column({
    name: 'discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 30.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseFloat(value) : value),
    },
  })
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @Column({
    name: 'min_topup_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseFloat(value) : value),
    },
  })
  @Min(0)
  minTopupAmount: number;

  @Column({
    name: 'max_discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseFloat(value) : value),
    },
  })
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @Column({ name: 'voucher_validity_days', type: 'integer', default: 30 })
  @Min(1)
  @Max(365)
  voucherValidityDays: number;

  @OneToMany(() => UserPromotion, (userPromotion) => userPromotion.campaign)
  userPromotions: UserPromotion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if campaign is active and has slots
  isEligibleForNewParticipants(): boolean {
    const now = new Date();
    return this.status === CampaignStatus.ACTIVE && now >= this.startDate && now <= this.endDate && this.currentParticipants < this.maxParticipants;
  }

  // Helper method to calculate remaining slots
  getRemainingSlots(): number {
    return Math.max(0, this.maxParticipants - this.currentParticipants);
  }
}
