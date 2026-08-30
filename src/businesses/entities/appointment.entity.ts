import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Business } from './business.entity';
import { BusinessLocation } from './business-location.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { AppointmentSource } from '../../common/enums/appointment-source.enum';

@Entity('appointments')
export class Appointment extends AbstractEntity {
  @ManyToOne(() => Business, (business) => business.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ApiProperty({ description: 'ID of the business this appointment belongs to.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ManyToOne(() => BusinessLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: BusinessLocation | null;

  @ApiPropertyOptional({ description: 'ID of the location this appointment is at, if any.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid', nullable: true, type: String })
  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ApiProperty({ description: 'Customer name.', example: 'Rahul Verma' })
  @Column({ name: 'customer_name' })
  customerName: string;

  @ApiProperty({ description: 'Customer phone number.', example: '+919876543210' })
  @Column({ name: 'customer_phone' })
  customerPhone: string;

  @ApiProperty({ description: 'Scheduled date/time, in UTC.', example: '2026-08-25T09:30:00.000Z', format: 'date-time' })
  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @ApiProperty({ description: 'Appointment length in minutes.', example: 30, default: 30 })
  @Column({ name: 'duration_minutes', default: 30 })
  durationMinutes: number;


  @ApiProperty({
    description: 'Current status. Starts at `requested`; a human or the voice-agent flow moves it to `confirmed`, and it eventually resolves to `completed`, `cancelled`, or `no_show`.',
    enum: AppointmentStatus,
    example: AppointmentStatus.REQUESTED,
    default: AppointmentStatus.REQUESTED,
  })
  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.REQUESTED })
  status: AppointmentStatus;

  /**
   * Defaults to phone_ai_agent since the long-term source of most bookings
   * will be the Exotel + Sarvam AI voice pipeline once that's wired up.
   */
  @ApiProperty({
    description: 'How the appointment was booked. Defaults to `phone_ai_agent` since most bookings are expected to come through the voice agent once Exotel/Sarvam AI are wired up; pass `manual` or `web` explicitly for dashboard/website bookings.',
    enum: AppointmentSource,
    example: AppointmentSource.MANUAL,
    default: AppointmentSource.PHONE_AI_AGENT,
  })
  @Column({ type: 'enum', enum: AppointmentSource, default: AppointmentSource.PHONE_AI_AGENT })
  source: AppointmentSource;

  @ApiPropertyOptional({ description: 'Free-text notes about the appointment.', example: 'Follow-up visit, bring previous prescription.', nullable: true, type: String })
  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
