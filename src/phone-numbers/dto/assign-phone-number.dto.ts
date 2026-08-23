import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhoneNumberStatus } from '../../common/enums/phone-number-status.enum';

export class AssignPhoneNumberDto {
  @ApiProperty({ description: 'The phone number to assign, in E.164 format.', example: '+912045678900' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ description: "The telephony provider's internal number SID/ID.", example: 'exo_num_8f3a2b1c' })
  @IsOptional()
  @IsString()
  providerNumberSid?: string;

  @ApiPropertyOptional({ description: 'Lifecycle status to set. Defaults to `active` if not provided.', enum: PhoneNumberStatus, example: PhoneNumberStatus.ACTIVE, default: PhoneNumberStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PhoneNumberStatus)
  status?: PhoneNumberStatus;

  @ApiPropertyOptional({ description: 'Free-text admin notes about this assignment.', example: 'Number ported from existing landline.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
