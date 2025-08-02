// src/database/seed.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from '../payments/entities/payment.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private usersService: UsersService,
  ) {}

  async seedDatabase(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    // Seed users
    await this.usersService.seedDefaultUsers();

    // Check if payments already exist
    const paymentCount = await this.paymentsRepository.count();
    if (paymentCount > 0) {
      console.log('Payments already exist, skipping payment seeding');
      return;
    }

    // Seed sample payments
    await this.seedPayments();
    console.log('✅ Database seeding completed!');
  }

  private async seedPayments(): Promise<void> {
    const samplePayments = [
      {
        amount: 1500.00,
        receiver: 'John Doe',
        status: PaymentStatus.SUCCESS,
        method: PaymentMethod.UPI,
        description: 'Payment for services',
        transactionId: 'TXN001' + Date.now(),
      },
      {
        amount: 2500.50,
        receiver: 'Jane Smith',
        status: PaymentStatus.SUCCESS,
        method: PaymentMethod.CREDIT_CARD,
        description: 'Product purchase',
        transactionId: 'TXN002' + Date.now(),
      },
      {
        amount: 750.00,
        receiver: 'Mike Johnson',
        status: PaymentStatus.FAILED,
        method: PaymentMethod.NET_BANKING,
        description: 'Subscription payment',
        transactionId: 'TXN003' + Date.now(),
      },
      {
        amount: 3200.00,
        receiver: 'Sarah Wilson',
        status: PaymentStatus.PENDING,
        method: PaymentMethod.DEBIT_CARD,
        description: 'Invoice payment',
        transactionId: 'TXN004' + Date.now(),
      },
      {
        amount: 890.75,
        receiver: 'David Brown',
        status: PaymentStatus.SUCCESS,
        method: PaymentMethod.WALLET,
        description: 'Online shopping',
        transactionId: 'TXN005' + Date.now(),
      },
    ];

    // Create payments with different dates for better trends
    for (let i = 0; i < samplePayments.length; i++) {
      const payment = this.paymentsRepository.create(samplePayments[i]);
      
      // Set different creation dates for trend visualization
      const daysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      payment.createdAt = createdAt;
      
      await this.paymentsRepository.save(payment);
    }

    // Create additional random payments for better data
    for (let i = 0; i < 15; i++) {
      const payment = this.paymentsRepository.create({
        amount: Math.floor(Math.random() * 5000) + 100,
        receiver: `Customer ${i + 6}`,
        status: [PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.PENDING][
          Math.floor(Math.random() * 3)
        ],
        method: [
          PaymentMethod.UPI,
          PaymentMethod.CREDIT_CARD,
          PaymentMethod.DEBIT_CARD,
          PaymentMethod.NET_BANKING,
          PaymentMethod.WALLET,
        ][Math.floor(Math.random() * 5)],
        description: `Random payment ${i + 1}`,
        transactionId: `TXN${String(i + 6).padStart(3, '0')}${Date.now()}`,
      });

      // Random date within last week
      const daysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      payment.createdAt = createdAt;

      await this.paymentsRepository.save(payment);
    }

    console.log('✅ Sample payments created');
  }
}