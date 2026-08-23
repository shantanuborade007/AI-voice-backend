import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessOwnershipGuard } from './guards/business-ownership.guard';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FaqEntry } from './entities/faq-entry.entity';

@ApiTags('FAQs')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiForbiddenResponse({ description: 'Caller is neither the owner of :businessId nor an admin.' })
@ApiParam({ name: 'businessId', description: 'Parent business ID (UUID).', format: 'uuid' })
@UseGuards(JwtAuthGuard, BusinessOwnershipGuard)
@Controller('businesses/:businessId/faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a FAQ entry', description: 'Creates a question/answer pair used by the voice agent as knowledge base content for this business.' })
  @ApiCreatedResponse({ description: 'FAQ entry created.', type: FaqEntry })
  create(@Param('businessId') businessId: string, @Body() dto: CreateFaqDto) {
    return this.faqsService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List FAQ entries for a business' })
  @ApiOkResponse({ description: 'List of FAQ entries.', type: FaqEntry, isArray: true })
  findAll(@Param('businessId') businessId: string) {
    return this.faqsService.findAll(businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single FAQ entry' })
  @ApiParam({ name: 'id', description: 'FAQ entry ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'The FAQ entry.', type: FaqEntry })
  @ApiNotFoundResponse({ description: 'FAQ entry not found for this business.' })
  findOne(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.faqsService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a FAQ entry', description: 'Partial update - only provided fields are changed.' })
  @ApiParam({ name: 'id', description: 'FAQ entry ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated FAQ entry.', type: FaqEntry })
  @ApiNotFoundResponse({ description: 'FAQ entry not found for this business.' })
  update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a FAQ entry' })
  @ApiParam({ name: 'id', description: 'FAQ entry ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'FAQ entry deleted.' })
  @ApiNotFoundResponse({ description: 'FAQ entry not found for this business.' })
  remove(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.faqsService.remove(businessId, id);
  }
}
