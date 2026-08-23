import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessOwnershipGuard } from './guards/business-ownership.guard';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { BusinessLocation } from './entities/business-location.entity';

@ApiTags('Locations')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiForbiddenResponse({ description: 'Caller is neither the owner of :businessId nor an admin.' })
@ApiParam({ name: 'businessId', description: 'Parent business ID (UUID).', format: 'uuid' })
@UseGuards(JwtAuthGuard, BusinessOwnershipGuard)
@Controller('businesses/:businessId/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a location to a business', description: 'Creates a branch/address record under the given business.' })
  @ApiCreatedResponse({ description: 'Location created.', type: BusinessLocation })
  create(@Param('businessId') businessId: string, @Body() dto: CreateLocationDto) {
    return this.locationsService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List locations for a business' })
  @ApiOkResponse({ description: 'List of locations.', type: BusinessLocation, isArray: true })
  findAll(@Param('businessId') businessId: string) {
    return this.locationsService.findAll(businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single location' })
  @ApiParam({ name: 'id', description: 'Location ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'The location.', type: BusinessLocation })
  @ApiNotFoundResponse({ description: 'Location not found for this business.' })
  findOne(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.locationsService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a location', description: 'Partial update - only provided fields are changed.' })
  @ApiParam({ name: 'id', description: 'Location ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated location.', type: BusinessLocation })
  @ApiNotFoundResponse({ description: 'Location not found for this business.' })
  update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a location' })
  @ApiParam({ name: 'id', description: 'Location ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Location deleted.' })
  @ApiNotFoundResponse({ description: 'Location not found for this business.' })
  remove(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.locationsService.remove(businessId, id);
  }
}
