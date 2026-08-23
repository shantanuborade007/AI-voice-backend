import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'New status for the appointment.', enum: AppointmentStatus, example: AppointmentStatus.CONFIRMED })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Free-text notes about the appointment.', example: 'Rescheduled at customer request.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
