import { IsEnum, IsObject, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../../common/enums/business-category.enum';

export class CreateBusinessDto {
  @ApiProperty({ description: 'Business display name.', example: 'Sharma Family Clinic', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'Business category.', enum: BusinessCategory, example: BusinessCategory.CLINIC_DOCTOR })
  @IsEnum(BusinessCategory)
  category: BusinessCategory;

  @ApiPropertyOptional({ description: 'Free-text description of the business.', example: 'General physician clinic open 7 days a week.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Public website URL.', example: 'https://sharmaclinic.example.com', format: 'url' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Arbitrary map of social platform name to URL/handle.',
    example: { instagram: 'https://instagram.com/sharmaclinic', facebook: 'https://facebook.com/sharmaclinic' },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
}
