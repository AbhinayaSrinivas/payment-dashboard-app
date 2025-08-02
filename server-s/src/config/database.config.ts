// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'simplepassword',
  database: process.env.DB_DATABASE || 'payment_dashboard',
  entities: [User, Payment],
  synchronize: true, // Set to false in production
  logging: process.env.NODE_ENV === 'development',
};