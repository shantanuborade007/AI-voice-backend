import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Business } from './business.entity';

export interface OpeningHoursEntry {
  day: number; // 0 = Sunday .. 6 = Saturday
  opensAt: string; // "09:00"
  closesAt: string; // "18:00"
  isClosed: boolean;
}

@Entity('business_locations')
export class BusinessLocation extends AbstractEntity {
  @ManyToOne(() => Business, (business) => business.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ApiProperty({ description: 'ID of the business this location belongs to.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ApiProperty({ description: 'Short label for this location (e.g. branch name).', example: 'Main Branch', maxLength: 120 })
  @Column()
  label: string;

  @ApiProperty({ description: 'Primary address line.', example: '221B Baker Street' })
  @Column()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Secondary address line.', example: 'Near City Hospital', nullable: true, type: String })
  @Column({ type: 'varchar', nullable: true })
  addressLine2: string | null;

  @ApiProperty({ description: 'City.', example: 'Pune' })
  @Column()
  city: string;

  @ApiProperty({ description: 'State/province.', example: 'Maharashtra' })
  @Column()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code.', example: '411001' })
  @Column()
  postalCode: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code.', example: 'IN', default: 'IN' })
  @Column({ default: 'IN' })
  country: string;

  @ApiPropertyOptional({ description: 'Latitude for map placement.', example: 18.5204, nullable: true, type: Number })
  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ description: 'Longitude for map placement.', example: 73.8567, nullable: true, type: Number })
  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

  @ApiPropertyOptional({ description: 'Direct contact phone number for this location.', example: '+919812345678', nullable: true, type: String })
  @Column({ type: 'varchar', nullable: true })
  contactPhone: string | null;

  @ApiProperty({
    description: 'Weekly opening hours, one entry per day of week actually configured. `day` is 0 (Sunday) through 6 (Saturday); `opensAt`/`closesAt` are "HH:mm" strings; `isClosed` overrides open/close times to mark the day fully closed.',
    example: [
      { day: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false },
      { day: 0, opensAt: '00:00', closesAt: '00:00', isClosed: true },
    ],
    isArray: true,
    type: Object,
  })
  @Column({ type: 'jsonb', default: [] })
  openingHours: OpeningHoursEntry[];

  @ApiProperty({ description: 'Whether this is the business primary/flagship location.', example: false, default: false })
  @Column({ default: false })
  isPrimary: boolean;
}
