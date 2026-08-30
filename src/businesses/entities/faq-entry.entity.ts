import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Business } from './business.entity';

/**
 * Structured Q&A that the Sarvam AI voice agent draws from when answering
 * inbound calls for this business (hours, pricing, policies, etc.).
 */
@Entity('faq_entries')
export class FaqEntry extends AbstractEntity {
  @ManyToOne(() => Business, (business) => business.faqEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ApiProperty({ description: 'ID of the business this FAQ belongs to.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ApiProperty({ description: 'The question, as a customer might phrase it.', example: 'Do you accept walk-ins?' })
  @Column({ type: 'text' })
  question: string;

  @ApiProperty({ description: 'The answer the voice agent should give.', example: 'Yes, walk-ins are welcome from 9am to 6pm, but appointments are given priority.' })
  @Column({ type: 'text' })
  answer: string;

  @ApiProperty({ description: 'Free-text tags for organizing/filtering FAQs (e.g. by topic).', example: ['hours', 'walk-ins'], type: String, isArray: true })
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  tags: string[];

  @ApiProperty({ description: 'Whether this FAQ is currently active and should be surfaced to the voice agent.', example: true, default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

}
