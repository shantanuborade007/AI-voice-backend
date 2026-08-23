import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpeningHoursEntryDto {
  @ApiProperty({ description: 'Day of week: 0 = Sunday .. 6 = Saturday.', example: 1, minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  day: number;

  @ApiProperty({ description: 'Opening time, "HH:mm" 24-hour format.', example: '09:00' })
  @IsString()
  opensAt: string;

  @ApiProperty({ description: 'Closing time, "HH:mm" 24-hour format.', example: '18:00' })
  @IsString()
  closesAt: string;

  @ApiProperty({ description: 'If true, the location is closed all day on this day of week (opensAt/closesAt are ignored).', example: false })
  @IsBoolean()
  isClosed: boolean;
}

export class CreateLocationDto {
  @ApiProperty({ description: 'Short label for this location (e.g. branch name).', example: 'Main Branch', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  label: string;

  @ApiProperty({ description: 'Primary address line.', example: '221B Baker Street' })
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Secondary address line.', example: 'Near City Hospital' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ description: 'City.', example: 'Pune' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State/province.', example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code.', example: '411001' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code. Defaults to "IN".', example: 'IN', default: 'IN' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude for map placement.', example: 18.5204 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for map placement.', example: 73.8567 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Direct contact phone number for this location.', example: '+919812345678' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Weekly opening hours entries. Omit a day to leave it unset.',
    type: () => OpeningHoursEntryDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpeningHoursEntryDto)
  openingHours?: OpeningHoursEntryDto[];

  @ApiPropertyOptional({ description: 'Whether this is the business primary/flagship location.', example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
