import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlansService } from './subscription-plans.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan, Subscription]), BusinessesModule, PhoneNumbersModule],
  controllers: [SubscriptionPlansController, SubscriptionsController],
  providers: [SubscriptionPlansService, SubscriptionsService],
  exports: [SubscriptionPlansService, SubscriptionsService],
})
export class SubscriptionsModule {}
