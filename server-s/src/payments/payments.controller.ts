// // src/payments/payments.controller.ts - Enhanced with all required features
// import { 
//   Controller, 
//   Get, 
//   Post, 
//   Body, 
//   Param, 
//   Query, 
//   ValidationPipe,
//   UseGuards,
//   ParseIntPipe,
//   Patch,
//   Res,
//   StreamableFile,
//   Response
// } from '@nestjs/common';
// // import { Response } from 'express';
// import { PaymentsService } from './payments.service';
// import { CreatePaymentDto } from './dto/create-payment.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth-guard';
// import { PaymentFilterDto } from './dto/payment-filter.dto';
// import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
// // import { response } from 'express';

// @Controller('payments')
// @UseGuards(JwtAuthGuard)
// export class PaymentsController {
//   constructor(private readonly paymentsService: PaymentsService) {}

//   @Post()
//   create(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto) {
//     return this.paymentsService.create(createPaymentDto);
//   }

//   @Get()
//   findAll(
//     @Query(ValidationPipe) filters: PaymentFilterDto,
//     @Query('page', ParseIntPipe) page: number = 1,
//     @Query('limit', ParseIntPipe) limit: number = 10,
//   ) {
//     return this.paymentsService.findAll(filters, page, limit);
//   }

//   // Enhanced stats endpoint with comprehensive data
//   @Get('stats')
//   async getStats() {
//     const stats = await this.paymentsService.getStats();
//     // const paymentMethods = await this.paymentsService.getPaymentMethodsBreakdown();
//     // const statusBreakdown = await this.paymentsService.getStatusBreakdown();
//     // const recentTransactions = await this.paymentsService.getRecentTransactions(5);
//     // const revenueTrend = await this.paymentsService.getRevenueTrend(7);

//     return {
//       ...stats,
//     };
//   }

//   // Quick stats for additional metrics
//   @Get('quick-stats')
//   getQuickStats() {
//     return this.paymentsService.getQuickStats();
//   }

//   // Export transactions to CSV
//   @Get('export')
//   async exportTransactions(
//     @Query(ValidationPipe) filters: PaymentFilterDto,
//     @Res({ passthrough: true }) res: Response,
//   ): Promise<StreamableFile> {
//     const csvBuffer = await this.paymentsService.exportToCSV(filters);
    
//     res.set({
//       'Content-Type': 'text/csv',
//       'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
//     });

//     return new StreamableFile(csvBuffer);
//   }

//   // Get transaction details
//   @Get(':id')
//   findOne(@Param('id', ParseIntPipe) id: number) {
//     return this.paymentsService.findOne(id);
//   }

//   // Update payment status
//   @Patch(':id/status')
//   updateStatus(
//     @Param('id', ParseIntPipe) id: number,
//     @Body(ValidationPipe) updateStatusDto: UpdatePaymentStatusDto,
//   ) {
//     return this.paymentsService.updateStatus(id, updateStatusDto.status);
//   }

//   // Get payment analytics
//   @Get('analytics/revenue-by-method')
//   getRevenueByMethod() {
//     return this.paymentsService.getRevenueByMethod();
//   }

//   @Get('analytics/hourly-distribution')
//   getHourlyDistribution() {
//     return this.paymentsService.getHourlyDistribution();
//   }

//   @Get('analytics/success-rate-trend')
//   getSuccessRateTrend(@Query('days', ParseIntPipe) days: number = 30) {
//     return this.paymentsService.getSuccessRateTrend(days);
//   }
// }

// src/payments/payments.controller.ts - Complete fixed version
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  ValidationPipe,
  UseGuards,
  ParseIntPipe,
  Patch,
  Res,
  StreamableFile
} from '@nestjs/common';
import type { Response } from 'express'; // Fixed: import as type
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth-guard';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  findAll(
    @Query(ValidationPipe) filters: PaymentFilterDto,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.paymentsService.findAll(filters, page, limit);
  }

  // Enhanced stats endpoint with comprehensive data
  @Get('stats')
  async getStats() {
    const stats = await this.paymentsService.getStats();
    const paymentMethods = await this.paymentsService.getPaymentMethodsBreakdown();
    const statusBreakdown = await this.paymentsService.getStatusBreakdown();
    const recentTransactions = await this.paymentsService.getRecentTransactions(5);
    const revenueTrend = await this.paymentsService.getRevenueTrend(7);

    return {
      ...stats,
      paymentMethods,
      statusBreakdown,
      recentTransactions,
      revenueTrend
    };
  }

  // Quick stats for additional metrics
  @Get('quick-stats')
  getQuickStats() {
    return this.paymentsService.getQuickStats();
  }

  // Export transactions to CSV
  @Get('export')
  async exportTransactions(
    @Query(ValidationPipe) filters: PaymentFilterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const csvBuffer = await this.paymentsService.exportToCSV(filters);
    
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
    });

    return new StreamableFile(csvBuffer);
  }

  // Get transaction details
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  // Update payment status
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updateStatus(id, updateStatusDto.status);
  }

  // Get payment analytics
  @Get('analytics/revenue-by-method')
  getRevenueByMethod() {
    return this.paymentsService.getRevenueByMethod();
  }

  @Get('analytics/hourly-distribution')
  getHourlyDistribution() {
    return this.paymentsService.getHourlyDistribution();
  }

  @Get('analytics/success-rate-trend')
  getSuccessRateTrend(@Query('days', ParseIntPipe) days: number = 30) {
    return this.paymentsService.getSuccessRateTrend(days);
  }
}