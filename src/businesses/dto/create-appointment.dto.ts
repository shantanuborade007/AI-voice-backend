import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentSource } from '../../common/enums/appointment-source.enum';

export class CreateAppointmentDto {
  @ApiPropertyOptional({ description: 'ID of the location this appointment is at.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ description: 'Customer name.', example: 'Rahul Verma' })
  @IsString()
  customerName: string;

  @ApiProperty({ description: 'Customer phone number.', example: '+919876543210' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Scheduled date/time, ISO-8601.', example: '2026-08-25T09:30:00.000Z', format: 'date-time' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Appointment length in minutes. Defaults to 30.', example: 30, minimum: 5, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'How the appointment was booked. Defaults to `phone_ai_agent`.',
    enum: AppointmentSource,
    example: AppointmentSource.MANUAL,
    default: AppointmentSource.PHONE_AI_AGENT,
  })
  @IsOptional()
  @IsEnum(AppointmentSource)
  source?: AppointmentSource;

  @ApiPropertyOptional({ description: 'Free-text notes about the appointment.', example: 'Follow-up visit, bring previous prescription.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
