import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { BusinessOwnershipGuard } from '../businesses/guards/business-ownership.guard';
import { PhoneNumbersService } from './phone-numbers.service';
import { AssignPhoneNumberDto } from './dto/assign-phone-number.dto';
import { PhoneNumberAssignment } from './entities/phone-number-assignment.entity';

@ApiTags('Phone Numbers')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiForbiddenResponse({ description: 'Caller is neither the owner of :businessId nor an admin (or, for PATCH, not an admin).' })
@ApiParam({ name: 'businessId', description: 'Parent business ID (UUID).', format: 'uuid' })
@UseGuards(JwtAuthGuard, BusinessOwnershipGuard)
@Controller('businesses/:businessId/phone-number')
export class PhoneNumbersController {
  constructor(private readonly phoneNumbersService: PhoneNumbersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the phone number assignment for a business',
    description: 'Lazily creates a `pending_kyc` assignment record on first call if none exists yet, then returns it. Accessible to the business owner or an admin.',
  })
  @ApiOkResponse({ description: 'The phone number assignment.', type: PhoneNumberAssignment })
  find(@Param('businessId') businessId: string) {
    return this.phoneNumbersService.findForBusiness(businessId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch()
  @ApiOperation({
    summary: 'Assign/update the phone number for a business',
    description: 'Admin-only. Call once Exotel KYC is approved and a number has been purchased/mapped in the Exotel dashboard. Sets `assignedAt` to the current time and defaults `status` to `active` if not provided.',
  })
  @ApiOkResponse({ description: 'Updated phone number assignment.', type: PhoneNumberAssignment })
  assign(@Param('businessId') businessId: string, @Body() dto: AssignPhoneNumberDto) {
    return this.phoneNumbersService.assign(businessId, dto);
  }
}
