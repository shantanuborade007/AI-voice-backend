import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Business } from '../../businesses/entities/business.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

@Entity('subscriptions')
export class Subscription extends AbstractEntity {
  @OneToOne(() => Business, (business) => business.subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ApiProperty({ description: 'ID of the business this subscription belongs to.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ApiPropertyOptional({ description: 'The subscribed plan, when explicitly loaded (e.g. GET .../subscription).', type: () => SubscriptionPlan })
  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @ApiProperty({ description: 'ID of the current plan.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'plan_id' })
  planId: string;

  @ApiProperty({
    description: 'Subscription status. `trialing` before any plan is selected, `active` once a plan is selected (billing is stubbed, so this happens immediately), `cancelled`/`past_due` reserved for future billing integration.',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
    default: SubscriptionStatus.TRIALING,
  })
  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Start of the current billing period, in UTC.', example: '2026-08-01T00:00:00.000Z', format: 'date-time' })
  @Column({ type: 'timestamptz' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'End of the current billing period, in UTC (one month after start).', example: '2026-09-01T00:00:00.000Z', format: 'date-time' })
  @Column({ type: 'timestamptz' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'If true, the subscription will not renew at the end of the current period.', example: false, default: false })
  @Column({ default: false })
  cancelAtPeriodEnd: boolean;

  // Not wired to a real payment gateway yet (per current scope: stub billing
  // in Postgres only). Populate these once Razorpay/Stripe checkout +
  // webhooks are added.
  @ApiPropertyOptional({ description: 'Payment provider name, once billing is wired up. Currently always null.', example: null, nullable: true, type: String })
  @Column({ type: 'varchar', nullable: true })
  paymentProvider: string | null;

  @ApiPropertyOptional({ description: 'Payment provider reference/subscription ID, once billing is wired up. Currently always null.', example: null, nullable: true, type: String })
  @Column({ type: 'varchar', nullable: true })
  paymentProviderReference: string | null;
}
