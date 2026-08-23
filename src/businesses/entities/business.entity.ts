import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { User } from '../../users/entities/user.entity';
import { BusinessCategory } from '../../common/enums/business-category.enum';
import { BusinessStatus } from '../../common/enums/business-status.enum';
import { BusinessLocation } from './business-location.entity';
import { CatalogItem } from './catalog-item.entity';
import { FaqEntry } from './faq-entry.entity';
import { AvailabilitySlot } from './availability-slot.entity';
import { Appointment } from './appointment.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { PhoneNumberAssignment } from '../../phone-numbers/entities/phone-number-assignment.entity';

@Entity('businesses')
export class Business extends AbstractEntity {
  @ManyToOne(() => User, (user) => user.businesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ApiProperty({ description: 'ID of the User that owns this business.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'owner_id' })
  ownerId: string;

  @ApiProperty({ description: 'Business display name.', example: 'Sharma Family Clinic', maxLength: 150 })
  @Column()
  name: string;

  @ApiProperty({ description: 'Business category, used for defaults and voice-agent context.', enum: BusinessCategory, example: BusinessCategory.CLINIC_DOCTOR, default: BusinessCategory.OTHER })
  @Column({ type: 'enum', enum: BusinessCategory, default: BusinessCategory.OTHER })
  category: BusinessCategory;

  @ApiPropertyOptional({ description: 'Free-text description of the business.', example: 'General physician clinic open 7 days a week.', nullable: true, type: String })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Lifecycle status of the business profile. `draft` on creation, `pending_review` once submitted, `active` once approved, `suspended` if disabled by an admin.',
    enum: BusinessStatus,
    example: BusinessStatus.DRAFT,
    default: BusinessStatus.DRAFT,
  })
  @Column({ type: 'enum', enum: BusinessStatus, default: BusinessStatus.DRAFT })
  status: BusinessStatus;

  @ApiPropertyOptional({ description: 'Public website URL.', example: 'https://sharmaclinic.example.com', nullable: true, type: String })
  @Column({ type: 'varchar', nullable: true })
  websiteUrl: string | null;

  @ApiPropertyOptional({
    description: 'Arbitrary map of social platform name to URL/handle.',
    example: { instagram: 'https://instagram.com/sharmaclinic', facebook: 'https://facebook.com/sharmaclinic' },
    nullable: true,
    type: Object,
  })
  @Column({ type: 'jsonb', nullable: true })
  socialLinks: Record<string, string> | null;

  @ApiPropertyOptional({ description: 'Branches/addresses belonging to this business. Only populated when explicitly loaded (e.g. GET /businesses/:id).', type: () => BusinessLocation, isArray: true })
  @OneToMany(() => BusinessLocation, (location) => location.business)
  locations: BusinessLocation[];

  @ApiPropertyOptional({ description: 'Products/services/menu items belonging to this business. Only populated when explicitly loaded.', type: () => CatalogItem, isArray: true })
  @OneToMany(() => CatalogItem, (item) => item.business)
  catalogItems: CatalogItem[];

  @ApiPropertyOptional({ description: 'FAQ knowledge base entries. Only populated when explicitly loaded.', type: () => FaqEntry, isArray: true })
  @OneToMany(() => FaqEntry, (faq) => faq.business)
  faqEntries: FaqEntry[];

  @ApiPropertyOptional({ description: 'Weekly recurring availability slots. Only populated when explicitly loaded.', type: () => AvailabilitySlot, isArray: true })
  @OneToMany(() => AvailabilitySlot, (slot) => slot.business)
  availabilitySlots: AvailabilitySlot[];

  @ApiPropertyOptional({ description: 'Appointment bookings. Only populated when explicitly loaded.', type: () => Appointment, isArray: true })
  @OneToMany(() => Appointment, (appointment) => appointment.business)
  appointments: Appointment[];

  @ApiPropertyOptional({ description: 'Current subscription record, if one exists. Only populated when explicitly loaded (e.g. GET /businesses/:id).', type: () => Subscription })
  @OneToOne(() => Subscription, (subscription) => subscription.business)
  subscription: Subscription;

  @ApiPropertyOptional({ description: 'Phone number assignment record, if one exists. Only populated when explicitly loaded (e.g. GET /businesses/:id).', type: () => PhoneNumberAssignment })
  @OneToOne(() => PhoneNumberAssignment, (assignment) => assignment.business)
  phoneNumberAssignment: PhoneNumberAssignment;
}
