import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectPlanDto {
  @ApiProperty({ description: 'ID of the SubscriptionPlan to select for this business.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @IsUUID()
  planId: string;
}
