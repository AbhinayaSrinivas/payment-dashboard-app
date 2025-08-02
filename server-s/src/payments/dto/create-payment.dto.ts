// src/payments/dto/create-payment.dto.ts
import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';
import { PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  receiver: string;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;
}

