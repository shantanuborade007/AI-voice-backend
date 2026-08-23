import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessOwnershipGuard } from './guards/business-ownership.guard';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { AvailabilitySlot } from './entities/availability-slot.entity';

@ApiTags('Availability')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiForbiddenResponse({ description: 'Caller is neither the owner of :businessId nor an admin.' })
@ApiParam({ name: 'businessId', description: 'Parent business ID (UUID).', format: 'uuid' })
@UseGuards(JwtAuthGuard, BusinessOwnershipGuard)
@Controller('businesses/:businessId/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a recurring availability window',
    description: 'Creates a weekly recurring availability window (e.g. Mon 9am-5pm) used to offer appointment slots. There is no uniqueness check across overlapping windows for the same day - the caller is responsible for avoiding overlaps.',
  })
  @ApiCreatedResponse({ description: 'Availability slot created.', type: AvailabilitySlot })
  create(@Param('businessId') businessId: string, @Body() dto: CreateAvailabilitySlotDto) {
    return this.availabilityService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List availability windows for a business', description: 'Returns windows ordered by day of week then start time.' })
  @ApiOkResponse({ description: 'List of availability slots.', type: AvailabilitySlot, isArray: true })
  findAll(@Param('businessId') businessId: string) {
    return this.availabilityService.findAll(businessId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an availability window' })
  @ApiParam({ name: 'id', description: 'Availability slot ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Availability slot deleted.' })
  @ApiNotFoundResponse({ description: 'Availability slot not found for this business.' })
  remove(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.availabilityService.remove(businessId, id);
  }
}
