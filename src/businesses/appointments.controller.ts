import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BusinessOwnershipGuard } from './guards/business-ownership.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.' })
@ApiForbiddenResponse({ description: 'Caller is neither the owner of :businessId nor an admin.' })
@ApiParam({ name: 'businessId', description: 'Parent business ID (UUID).', format: 'uuid' })
@UseGuards(JwtAuthGuard, BusinessOwnershipGuard)
@Controller('businesses/:businessId/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an appointment',
    description: 'Dashboard/manual creation for now. Once the Exotel + Sarvam AI voice pipeline is live, the same underlying service will be called from a webhook to turn a phone call into an appointment. `source` defaults to `phone_ai_agent` if not provided.',
  })
  @ApiCreatedResponse({ description: 'Appointment created.', type: Appointment })
  create(@Param('businessId') businessId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments for a business', description: 'Returns appointments ordered by scheduledAt ascending.' })
  @ApiOkResponse({ description: 'List of appointments.', type: Appointment, isArray: true })
  findAll(@Param('businessId') businessId: string) {
    return this.appointmentsService.findAll(businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'The appointment.', type: Appointment })
  @ApiNotFoundResponse({ description: 'Appointment not found for this business.' })
  findOne(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.appointmentsService.findOne(businessId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an appointment',
    description: 'Only `status` and `notes` can be updated. To change the schedule, delete and recreate the appointment.',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated appointment.', type: Appointment })
  @ApiNotFoundResponse({ description: 'Appointment not found for this business.' })
  update(@Param('businessId') businessId: string, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID (UUID).', format: 'uuid' })
  @ApiOkResponse({ description: 'Appointment deleted.' })
  @ApiNotFoundResponse({ description: 'Appointment not found for this business.' })
  remove(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.appointmentsService.remove(businessId, id);
  }
}
