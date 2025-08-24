import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsEnum, IsOptional } from 'class-validator';
import { UserPromotion } from './user-promotion.entity';
import { IsVoucherCode } from '../../common/validators/voucher-code.validator';

export enum VoucherStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum VoucherType {
  MOBILE_TOPUP_DISCOUNT = 'mobile_topup_discount',
}

@Entity('vouchers')
@Index('idx_vouchers_code', ['code'], { unique: true })
@Index('idx_vouchers_status', ['status'])
@Index('idx_vouchers_expiry', ['expiresAt'])
@Index('idx_vouchers_user_promotion', ['userPromotionId'])
@Index('idx_vouchers_type', ['type'])
export class Voucher {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @IsVoucherCode()
  code: string; // Unique voucher code

  @Column({ name: 'user_promotion_id', type: 'bigint' })
  userPromotionId: string;

  @Column({ type: 'enum', enum: VoucherType, default: VoucherType.MOBILE_TOPUP_DISCOUNT })
  @IsEnum(VoucherType)
  type: VoucherType;

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.ACTIVE })
  @IsEnum(VoucherStatus)
  status: VoucherStatus;

  @Column({
    name: 'discount_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseFloat(value) : value),
    },
  })
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
  maxDiscountAmount?: number;

  @Column({ name: 'issued_at', type: 'timestamp' })
  issuedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  @IsOptional()
  usedAt?: Date;

  @Column({
    name: 'used_amount',
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
  usedAmount?: number; // Original topup amount when voucher was used

  @Column({
    name: 'discount_amount',
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
  discountAmount?: number; // Actual discount amount applied

  @Column({ name: 'transaction_reference', type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  transactionReference?: string; // Reference to the topup transaction

  @ManyToOne(() => UserPromotion, (userPromotion) => userPromotion.vouchers, { eager: false })
  @JoinColumn({ name: 'user_promotion_id' })
  userPromotion: UserPromotion;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to check if voucher is valid
  isValid(): boolean {
    const now = new Date();
    return this.status === VoucherStatus.ACTIVE && now <= this.expiresAt;
  }

  // Helper method to check if voucher is expired
  isExpired(): boolean {
    const now = new Date();
    return now > this.expiresAt;
  }

  // Helper method to calculate discount amount
  calculateDiscount(topupAmount: number): number {
    if (!this.isValid() || topupAmount < this.minTopupAmount) {
      return 0;
    }

    let discount = (topupAmount * this.discountPercentage) / 100;

    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }
}
