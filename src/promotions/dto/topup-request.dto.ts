import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsPhoneNumber } from 'class-validator';

export class TopupRequestDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string = 'bank_transfer';
}

export class TopupResponseDto {
  success: boolean;
  transactionId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  phoneNumber: string;
  voucherCode?: string;
  message: string;
}
