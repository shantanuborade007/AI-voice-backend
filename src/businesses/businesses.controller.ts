import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BusinessOwnershipGuard } from './guards/business-ownership.guard';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './entities/business.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Businesses')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a business profile',
    description: 'Creates a new business owned by the authenticated user. Any authenticated user (business_owner or admin) can create a business; it is always owned by the caller.',
  })
  @ApiCreatedResponse({ description: 'Business created.', type: Business })
  create(@CurrentUser() user: User, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List businesses',
    description: 'Admins receive every business on the platform. Business owners receive only the businesses they own.',
  })
  @ApiOkResponse({ description: 'List of businesses visible to the caller.', type: Business, isArray: true })
  findAll(@CurrentUser() user: User) {
    return this.businessesService.findAllForUser(user);
  }

  @UseGuards(BusinessOwnershipGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Get a business by ID',
    description: 'Returns the business with its locations, catalog items, FAQ entries, availability slots, subscription (with plan), and phone number assignment eagerly loaded. Requires the caller to be the owner or an admin.',
  })
  @ApiParam({ name: 'id', description: 'Business ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'The business.', type: Business })
  @ApiForbiddenResponse({ description: 'Caller is neither the owner nor an admin.' })
  @ApiNotFoundResponse({ description: 'Business not found.' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @UseGuards(BusinessOwnershipGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a business',
    description: 'Partially updates a business profile. Requires the caller to be the owner or an admin.',
  })
  @ApiParam({ name: 'id', description: 'Business ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated business.', type: Business })
  @ApiForbiddenResponse({ description: 'Caller is neither the owner nor an admin.' })
  @ApiNotFoundResponse({ description: 'Business not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessesService.update(id, dto);
  }

  @UseGuards(BusinessOwnershipGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a business',
    description: 'Permanently deletes a business and cascades to its locations, catalog items, FAQs, availability slots, appointments, subscription, and phone number assignment. Requires the caller to be the owner or an admin.',
  })
  @ApiParam({ name: 'id', description: 'Business ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Business deleted.' })
  @ApiForbiddenResponse({ description: 'Caller is neither the owner nor an admin.' })
  @ApiNotFoundResponse({ description: 'Business not found.' })
  remove(@Param('id') id: string) {
    return this.businessesService.remove(id);
  }
}
