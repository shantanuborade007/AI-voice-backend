import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';
import { BusinessesService } from '../businesses/businesses.service';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription) private readonly subscriptionsRepository: Repository<Subscription>,
    private readonly plansService: SubscriptionPlansService,
    private readonly businessesService: BusinessesService,
    private readonly phoneNumbersService: PhoneNumbersService,
  ) {}

  findForBusiness(businessId: string) {
    return this.subscriptionsRepository.findOne({ where: { businessId }, relations: ['plan'] });
  }

  /**
   * Selecting a plan activates the subscription directly - there is no
   * payment gateway wired up yet (per current scope). Swap this for a real
   * Razorpay/Stripe checkout + webhook flow once billing goes live.
   */
  async selectPlan(businessId: string, planId: string) {
    this.logger.log(`Selecting plan ${planId} for business ${businessId}`);
    await this.plansService.findOne(planId);

    let subscription = await this.subscriptionsRepository.findOne({ where: { businessId } });
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (!subscription) {
      subscription = this.subscriptionsRepository.create({
        businessId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    } else {
      subscription.planId = planId;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.cancelAtPeriodEnd = false;
    }

    const saved = await this.subscriptionsRepository.save(subscription);
    this.logger.log(`Subscription ${saved.id} for business ${businessId} activated on plan ${planId}, period ends ${periodEnd.toISOString()}`);

    // Best-effort: a failed Exotel provisioning call shouldn't block the
    // subscription itself from activating.
    try {
      const business = await this.businessesService.findOne(businessId);
      await this.phoneNumbersService.autoProvision(businessId, business);
    } catch (error) {
      this.logger.warn(`Could not auto-provision a number for business ${businessId}: ${error.message}`);
    }

    return saved;
  }

  async cancel(businessId: string) {
    this.logger.log(`Cancelling subscription for business ${businessId}`);
    const subscription = await this.subscriptionsRepository.findOne({ where: { businessId } });
    if (!subscription) {
      this.logger.warn(`Cancel failed: no subscription for business ${businessId}`);
      throw new NotFoundException('No active subscription for this business');
    }
    subscription.cancelAtPeriodEnd = true;
    const saved = await this.subscriptionsRepository.save(subscription);
    this.logger.log(`Subscription ${saved.id} for business ${businessId} will cancel at period end`);
    return saved;
  }
}
