import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaymentFilterDto {
  @IsOptional()
  @IsString()
  receiver?: string;

  @IsOptional()
  @IsEnum(['success', 'pending', 'failed'])
  status?: 'success' | 'pending' | 'failed';

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  minAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  maxAmount?: number;
}