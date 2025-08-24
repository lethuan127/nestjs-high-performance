import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { IsEnum, IsOptional } from 'class-validator';
import { User } from '../../auth/user.entity';
import { PromotionCampaign } from './promotion-campaign.entity';
import { Voucher } from './voucher.entity';

export enum ParticipationStatus {
  ELIGIBLE = 'eligible',
  VOUCHER_ISSUED = 'voucher_issued',
  VOUCHER_USED = 'voucher_used',
  EXPIRED = 'expired',
}

@Entity('user_promotions')
@Index('idx_user_promotions_user_campaign', ['userId', 'campaignId'], { unique: true })
@Index('idx_user_promotions_status', ['status'])
@Index('idx_user_promotions_first_login', ['firstLoginAt'])
@Index('idx_user_promotions_campaign', ['campaignId'])
export class UserPromotion {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @Column({ name: 'campaign_id', type: 'bigint' })
  campaignId: string;

  @Column({ type: 'enum', enum: ParticipationStatus, default: ParticipationStatus.ELIGIBLE })
  @IsEnum(ParticipationStatus)
  status: ParticipationStatus;

  @Column({ name: 'first_login_at', type: 'timestamp' })
  firstLoginAt: Date;

  @Column({ name: 'voucher_issued_at', type: 'timestamp', nullable: true })
  @IsOptional()
  voucherIssuedAt?: Date;

  @Column({ name: 'voucher_used_at', type: 'timestamp', nullable: true })
  @IsOptional()
  voucherUsedAt?: Date;

  @Column({ name: 'participation_order', type: 'integer' })
  participationOrder: number; // 1-100 for tracking order of participation

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PromotionCampaign, (campaign) => campaign.userPromotions, { eager: false })
  @JoinColumn({ name: 'campaign_id' })
  campaign: PromotionCampaign;

  @OneToMany(() => Voucher, (voucher) => voucher.userPromotion)
  vouchers: Voucher[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if user is in first 100
  isInFirstHundred(): boolean {
    return this.participationOrder <= 100;
  }

  // Helper method to check if eligible for voucher
  isEligibleForVoucher(): boolean {
    return this.status === ParticipationStatus.ELIGIBLE && this.isInFirstHundred();
  }
}
