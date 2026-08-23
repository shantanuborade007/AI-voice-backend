import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAvailabilitySlotDto {
  @ApiProperty({ description: 'Day of week this window recurs on: 0 = Sunday .. 6 = Saturday.', example: 1, minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Window start time ("HH:mm" or "HH:mm:ss").', example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Window end time ("HH:mm" or "HH:mm:ss").', example: '17:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Length of each bookable slot within the window, in minutes. Defaults to 30.', example: 30, minimum: 5, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Whether this recurring window is currently offered. Defaults to true.', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
