import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Business } from '../../businesses/entities/business.entity';
import { PhoneNumberStatus } from '../../common/enums/phone-number-status.enum';

/**
 * Tracks the telephony number mapped to a business (surfaced e.g. on their
 * Google Maps listing) and the voice agent that answers it. Starts out
 * pending_kyc to reflect that Exotel account verification has to clear
 * before a real number can be purchased/mapped.
 */
@Entity('phone_number_assignments')
export class PhoneNumberAssignment extends AbstractEntity {
  @OneToOne(() => Business, (business) => business.phoneNumberAssignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ApiProperty({ description: 'ID of the business this assignment belongs to.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ApiProperty({ description: 'Telephony provider name.', example: 'exotel', default: 'exotel' })
  @Column({ name: 'telephony_provider', default: 'exotel' })
  telephonyProvider: string;

  @ApiPropertyOptional({ description: 'The assigned phone number, in E.164 format. Null until an admin assigns one.', example: '+912045678900', nullable: true, type: String })
  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @ApiPropertyOptional({ description: "The telephony provider's internal number SID/ID.", example: 'exo_num_8f3a2b1c', nullable: true, type: String })
  @Column({ name: 'provider_number_sid', type: 'varchar', nullable: true })
  providerNumberSid: string | null;

  @ApiProperty({
    description: 'Lifecycle status. Starts at `pending_kyc` (waiting on Exotel account verification), then `pending_assignment`, `active` once a number is live, or `suspended`.',
    enum: PhoneNumberStatus,
    example: PhoneNumberStatus.PENDING_KYC,
    default: PhoneNumberStatus.PENDING_KYC,
  })
  @Column({ type: 'enum', enum: PhoneNumberStatus, default: PhoneNumberStatus.PENDING_KYC })
  status: PhoneNumberStatus;

  @ApiProperty({ description: 'AI voice agent provider name.', example: 'sarvam_ai', default: 'sarvam_ai' })
  @Column({ name: 'voice_agent_provider', default: 'sarvam_ai' })
  voiceAgentProvider: string;

  @ApiPropertyOptional({ description: 'Free-text admin notes about this assignment.', example: 'KYC submitted 2026-08-10, awaiting Exotel approval.', nullable: true, type: String })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ description: 'Timestamp the number was assigned, in UTC. Null until assigned.', example: '2026-08-20T12:00:00.000Z', format: 'date-time', nullable: true, type: String })
  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt: Date | null;
}
