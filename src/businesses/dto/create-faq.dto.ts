import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({ description: 'The question, as a customer might phrase it.', example: 'Do you accept walk-ins?' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'The answer the voice agent should give.', example: 'Yes, walk-ins are welcome from 9am to 6pm, but appointments are given priority.' })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ description: 'Free-text tags for organizing/filtering FAQs.', example: ['hours', 'walk-ins'], type: String, isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
