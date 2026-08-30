import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Business } from './business.entity';

/**
 * A recurring weekly availability window used to offer appointment slots
 * (e.g. doctors, salons). Not every business will use this.
 */
@Entity('availability_slots')
export class AvailabilitySlot extends AbstractEntity {
  @ManyToOne(() => Business, (business) => business.availabilitySlots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ApiProperty({ description: 'ID of the business this slot belongs to.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ApiProperty({ description: 'Day of week this window recurs on: 0 = Sunday .. 6 = Saturday.', example: 1, minimum: 0, maximum: 6 })
  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday

  @ApiProperty({ description: 'Window start time ("HH:mm:ss").', example: '09:00:00' })
  @Column({ name: 'start_time', type: 'time' })
  startTime: string; // "09:00:00"

  @ApiProperty({ description: 'Window end time ("HH:mm:ss").', example: '17:00:00' })
  @Column({ name: 'end_time', type: 'time' })
  endTime: string; // "17:00:00"

  @ApiProperty({ description: 'Length of each bookable slot within the window, in minutes.', example: 30, default: 30 })
  @Column({ name: 'slot_duration_minutes', default: 30 })
  slotDurationMinutes: number;

  @ApiProperty({ description: 'Whether this recurring window is currently offered.', example: true, default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

}
