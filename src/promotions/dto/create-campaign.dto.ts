import { IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max, IsString } from 'class-validator';
import { CampaignType } from '../entities/promotion-campaign.entity';

export class CreateCampaignDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  maxParticipants?: number = 100;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number = 30;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minTopupAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  voucherValidityDays?: number = 30;
}
