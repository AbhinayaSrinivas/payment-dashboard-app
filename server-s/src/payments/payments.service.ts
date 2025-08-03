// src/payments/payments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
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

  // FIXED: Made public and accepts days parameter
  async getRevenueTrend(days: number = 7): Promise<{ date: string; revenue: number }[]> {
    const trendData: { date: string; revenue: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
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
        .getRawOne<{ total: string | null }>();

      trendData.push({
        date: date.toISOString().split('T')[0],
        revenue: Number(revenue?.total ?? 0),
      });
    }

    return trendData;
  }

  // NEW METHODS - All the missing ones from the controller

  // Payment methods breakdown
  async getPaymentMethodsBreakdown() {
    const result = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('payment.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'total')
      .groupBy('payment.method')
      .getRawMany();

    // Calculate percentages
    const totalCount = result.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    return result.map(item => ({
      method: item.method,
      count: parseInt(item.count),
      total: parseFloat(item.total || '0'),
      percentage: totalCount > 0 ? Math.round((parseInt(item.count) / totalCount) * 100) : 0
    }));
  }

  // Status breakdown
  async getStatusBreakdown() {
    const result = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .groupBy('payment.status')
      .getRawMany();

    return result.map(item => ({
      status: item.status,
      count: parseInt(item.count),
      amount: parseFloat(item.amount || '0')
    }));
  }

  // Recent transactions
  async getRecentTransactions(limit: number = 5) {
    return this.paymentsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Quick stats
  async getQuickStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's stats
    const todayStats = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.createdAt >= :today', { today })
      .andWhere('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();

    // Yesterday's stats
    const yesterdayStats = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.createdAt >= :yesterday', { yesterday })
      .andWhere('payment.createdAt < :today', { today })
      .andWhere('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();

    // Overall stats
    const totalTransactions = await this.paymentsRepository.count();
    const successfulTransactions = await this.paymentsRepository.count({ 
      where: { status: PaymentStatus.SUCCESS } 
    });
    
    const avgAmountResult = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('AVG(payment.amount)', 'avg')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();

    // Calculate peak hour (simplified - you can enhance this)
    const hourlyStats = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('EXTRACT(HOUR FROM payment.createdAt)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .groupBy('EXTRACT(HOUR FROM payment.createdAt)')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    const successRate = totalTransactions > 0 
      ? (successfulTransactions / totalTransactions) * 100 
      : 0;

    return {
      today: {
        transactions: parseInt(todayStats?.count || '0'),
        revenue: parseFloat(todayStats?.revenue || '0'),
      },
      yesterday: {
        transactions: parseInt(yesterdayStats?.count || '0'),
        revenue: parseFloat(yesterdayStats?.revenue || '0'),
      },
      totalTransactions,
      successRate: parseFloat(successRate.toFixed(1)),
      avgTransactionAmount: parseFloat(avgAmountResult?.avg || '0'),
      peakHour: hourlyStats ? `${hourlyStats.hour}:00` : '12:00'
    };
  }

  // Export to CSV
  async exportToCSV(filters: PaymentFilterDto): Promise<Buffer> {
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

    const payments = await this.paymentsRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });
    
    // Create CSV content
    const header = 'ID,Transaction ID,Amount,Status,Method,Receiver,Created At,Updated At\n';
    const rows = payments.map(payment => 
      `${payment.id},${payment.transactionId || ''},${payment.amount},${payment.status},${payment.method || ''},${payment.receiver || ''},${payment.createdAt},${payment.updatedAt}`
    ).join('\n');
    
    return Buffer.from(header + rows, 'utf-8');
  }

  // Update payment status
  async updateStatus(id: number, status: string) {
    const payment = await this.paymentsRepository.findOne({ where: { id } });
    
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    // Validate status if you have enum values
    if (!Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }

    payment.status = status as PaymentStatus;
    payment.updatedAt = new Date();
    
    return this.paymentsRepository.save(payment);
  }

  // Revenue by payment method
  async getRevenueByMethod() {
    const result = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('payment.method', 'method')
      .addSelect('SUM(payment.amount)', 'revenue')
      .addSelect('COUNT(*)', 'transactions')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .groupBy('payment.method')
      .getRawMany();

    return result.map(item => ({
      method: item.method,
      revenue: parseFloat(item.revenue || '0'),
      transactions: parseInt(item.transactions)
    }));
  }

  // Hourly distribution
  async getHourlyDistribution() {
    const result = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('EXTRACT(HOUR FROM payment.createdAt)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .groupBy('EXTRACT(HOUR FROM payment.createdAt)')
      .orderBy('hour', 'ASC')
      .getRawMany();

    return result.map(item => ({
      hour: parseInt(item.hour),
      count: parseInt(item.count),
      revenue: parseFloat(item.revenue || '0')
    }));
  }

  // Success rate trend
  async getSuccessRateTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('DATE(payment.createdAt)', 'date')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN payment.status = :successStatus THEN 1 ELSE 0 END)', 'successful')
      .where('payment.createdAt >= :startDate', { startDate })
      .setParameter('successStatus', PaymentStatus.SUCCESS)
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map(item => ({
      date: item.date,
      total: parseInt(item.total),
      successful: parseInt(item.successful),
      successRate: parseFloat(((parseInt(item.successful) / parseInt(item.total)) * 100).toFixed(2))
    }));
  }

  private generateTransactionId(): string {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
}