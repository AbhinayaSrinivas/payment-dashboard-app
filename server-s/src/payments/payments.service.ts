// src/payments/payments.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';


@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      transactionId: this.generateTransactionId(),
    });
    return this.paymentsRepository.save(payment);
  }

  async findAll(filters: PaymentFilterDto, page: number = 1, limit: number = 10) {
    const where: any = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.method) {
      where.method = filters.method;
    }
    
    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const [payments, total] = await this.paymentsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Payment | null> {
    return this.paymentsRepository.findOne({ where: { id } });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Today's payments
    const todayPayments = await this.paymentsRepository.count({
      where: { createdAt: Between(today, new Date()) }
    });

    // This week's payments
    const weekPayments = await this.paymentsRepository.count({
      where: { createdAt: Between(weekAgo, new Date()) }
    });

    // Total revenue
    const totalRevenue = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();

    // Failed transactions
    const failedTransactions = await this.paymentsRepository.count({
      where: { status: PaymentStatus.FAILED }
    });

    // Revenue trend (last 7 days)
    const revenueTrend = await this.getRevenueTrend();

    return {
      todayPayments,
      weekPayments,
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
      failedTransactions,
      revenueTrend,
    };
  }

  private async getRevenueTrend(): Promise<{ date: string; revenue: number }[]> {
  const last7Days: { date: string; revenue: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const revenue = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('payment.createdAt >= :start', { start: date })
      .andWhere('payment.createdAt < :end', { end: nextDay })
      .getRawOne<{ total: string | null }>(); // <- specify return type

    last7Days.push({
      date: date.toISOString().split('T')[0],
      revenue: Number(revenue?.total ?? 0), // safer than parseFloat(revenue?.total || '0')
    });
  }

  return last7Days;
}


  private generateTransactionId(): string {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
}