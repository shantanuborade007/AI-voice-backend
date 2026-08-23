import { IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanFeatures } from '../entities/subscription-plan.entity';

export class CreatePlanDto {
  @ApiProperty({ description: 'Unique machine-readable plan code.', example: 'growth' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Human-readable plan name.', example: 'Growth' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Monthly price.', example: 2499, minimum: 0 })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiPropertyOptional({ description: 'ISO 4217 currency code. Defaults to "INR".', example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Feature limits/entitlements for this plan.',
    type: () => PlanFeatures,
    example: { maxLocations: 3, maxCatalogItems: 100, appointmentBooking: true, aiMinutesIncluded: 400 },
  })
  @IsObject()
  features: PlanFeatures;

  @ApiPropertyOptional({ description: 'Whether the plan is currently offered. Defaults to true.', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Manual sort order for display (ascending). Defaults to 0.', example: 2, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
