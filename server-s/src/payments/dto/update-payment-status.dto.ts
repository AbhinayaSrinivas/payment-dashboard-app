import { IsEnum } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsEnum(['success', 'pending', 'failed'])
  status: 'success' | 'pending' | 'failed';
}