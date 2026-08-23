import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessOwnershipGuard } from './guards/business-ownership.guard';
import { CatalogItemsService } from './catalog-items.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CatalogItem } from './entities/catalog-item.entity';

@ApiTags('Catalog Items')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiForbiddenResponse({ description: 'Caller is neither the owner of :businessId nor an admin.' })
@ApiParam({ name: 'businessId', description: 'Parent business ID (UUID).', format: 'uuid' })
@UseGuards(JwtAuthGuard, BusinessOwnershipGuard)
@Controller('businesses/:businessId/catalog-items')
export class CatalogItemsController {
  constructor(private readonly catalogItemsService: CatalogItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a catalog item', description: 'Creates a product/service/menu item under the given business.' })
  @ApiCreatedResponse({ description: 'Catalog item created.', type: CatalogItem })
  create(@Param('businessId') businessId: string, @Body() dto: CreateCatalogItemDto) {
    return this.catalogItemsService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List catalog items for a business', description: 'Returns items ordered by sortOrder ascending.' })
  @ApiOkResponse({ description: 'List of catalog items.', type: CatalogItem, isArray: true })
  findAll(@Param('businessId') businessId: string) {
    return this.catalogItemsService.findAll(businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single catalog item' })
  @ApiParam({ name: 'id', description: 'Catalog item ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'The catalog item.', type: CatalogItem })
  @ApiNotFoundResponse({ description: 'Catalog item not found for this business.' })
  findOne(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.catalogItemsService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a catalog item', description: 'Partial update - only provided fields are changed.' })
  @ApiParam({ name: 'id', description: 'Catalog item ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated catalog item.', type: CatalogItem })
  @ApiNotFoundResponse({ description: 'Catalog item not found for this business.' })
  update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() dto: UpdateCatalogItemDto) {
    return this.catalogItemsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a catalog item' })
  @ApiParam({ name: 'id', description: 'Catalog item ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Catalog item deleted.' })
  @ApiNotFoundResponse({ description: 'Catalog item not found for this business.' })
  remove(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.catalogItemsService.remove(businessId, id);
  }
}
