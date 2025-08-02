import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export class PaymentFilterDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}