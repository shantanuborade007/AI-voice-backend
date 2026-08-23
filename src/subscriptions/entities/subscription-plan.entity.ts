import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';

export class PlanFeatures {
  @ApiProperty({ description: 'Maximum number of locations a business on this plan can create.', example: 3 })
  maxLocations: number;

  @ApiProperty({ description: 'Maximum number of catalog items a business on this plan can create.', example: 100 })
  maxCatalogItems: number;

  @ApiProperty({ description: 'Whether the appointment booking feature is included in this plan.', example: true })
  appointmentBooking: boolean;

  @ApiProperty({ description: 'AI voice agent minutes included per billing period.', example: 400 })
  aiMinutesIncluded: number;
}

@Entity('subscription_plans')
export class SubscriptionPlan extends AbstractEntity {
  @ApiProperty({ description: 'Unique machine-readable plan code.', example: 'growth' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ description: 'Human-readable plan name.', example: 'Growth' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Monthly price, stored as a fixed-point decimal string (numeric(10,2)).', example: '2499.00' })
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  priceMonthly: string;

  @ApiProperty({ description: 'ISO 4217 currency code.', example: 'INR', default: 'INR' })
  @Column({ default: 'INR' })
  currency: string;

  @ApiProperty({ description: 'Feature limits/entitlements for this plan.', type: () => PlanFeatures })
  @Column({ type: 'jsonb' })
  features: PlanFeatures;

  @ApiProperty({ description: 'Whether the plan is currently offered. Inactive plans are hidden from the public plan list.', example: true, default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Manual sort order for display (ascending).', example: 2, default: 0 })
  @Column({ default: 0 })
  sortOrder: number;
}
