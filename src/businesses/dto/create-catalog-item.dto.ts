import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatalogItemDto {
  @ApiProperty({ description: 'Item/product/service name.', example: 'General Consultation', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ description: 'Item description.', example: '30-minute consultation with a general physician.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Price. Omit for "price on request".', example: 500, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'ISO 4217 currency code. Defaults to "INR".', example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Image URL for this item.', example: 'https://cdn.example.com/items/consultation.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Free-text category/section grouping for this item.', example: 'Consultations' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the item is currently offered/in stock. Defaults to true.', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Manual sort order for display (ascending). Defaults to 0.', example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
