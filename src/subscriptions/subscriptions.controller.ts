import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessOwnershipGuard } from '../businesses/guards/business-ownership.guard';
import { SubscriptionsService } from './subscriptions.service';
import { SelectPlanDto } from './dto/select-plan.dto';
import { Subscription } from './entities/subscription.entity';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiForbiddenResponse({ description: 'Caller is neither the owner of :businessId nor an admin.' })
@ApiParam({ name: 'businessId', description: 'Parent business ID (UUID).', format: 'uuid' })
@UseGuards(JwtAuthGuard, BusinessOwnershipGuard)
@Controller('businesses/:businessId/subscription')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the current subscription',
    description: 'Returns the subscription for this business with its plan loaded, or `null` if no plan has ever been selected.',
  })
  @ApiOkResponse({ description: 'The subscription, or null if none exists yet.', type: Subscription })
  find(@Param('businessId') businessId: string) {
    return this.subscriptionsService.findForBusiness(businessId);
  }

  @Post('select-plan')
  @ApiOperation({
    summary: 'Select (or change) a subscription plan',
    description: 'Activates the subscription immediately - billing is stubbed, there is no payment gateway wired up yet. Creates the subscription if it does not exist, or switches the existing one to the new plan and resets the current billing period to one month from now.',
  })
  @ApiCreatedResponse({ description: 'Subscription activated with the selected plan.', type: Subscription })
  @ApiNotFoundResponse({ description: 'The requested plan does not exist.' })
  selectPlan(@Param('businessId') businessId: string, @Body() dto: SelectPlanDto) {
    return this.subscriptionsService.selectPlan(businessId, dto.planId);
  }

  @Post('cancel')
  @ApiOperation({
    summary: 'Cancel the subscription',
    description: 'Marks the subscription to not renew at the end of the current billing period (sets cancelAtPeriodEnd=true). Does not immediately revoke access.',
  })
  @ApiOkResponse({ description: 'Subscription marked to cancel at period end.', type: Subscription })
  @ApiNotFoundResponse({ description: 'No subscription exists yet for this business.' })
  cancel(@Param('businessId') businessId: string) {
    return this.subscriptionsService.cancel(businessId);
  }
}
