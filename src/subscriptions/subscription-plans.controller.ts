import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@ApiTags('Subscription Plans')
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List active subscription plans', description: 'Public endpoint - no authentication required. Returns only plans with isActive=true, ordered by sortOrder ascending.' })
  @ApiOkResponse({ description: 'List of active plans.', type: SubscriptionPlan, isArray: true })
  findAll() {
    return this.plansService.findAllActive();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Create a subscription plan', description: 'Admin-only. `code` must be unique across all plans.' })
  @ApiCreatedResponse({ description: 'Plan created.', type: SubscriptionPlan })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
  @ApiForbiddenResponse({ description: 'Caller is not an admin.' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }
}
