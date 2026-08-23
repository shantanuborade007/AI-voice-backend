import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(@InjectRepository(Appointment) private readonly appointmentsRepository: Repository<Appointment>) {}

  /**
   * Dashboard/manual creation for now. Once the Exotel + Sarvam AI voice
   * pipeline is live, a webhook controller can call this same service to
   * turn a phone call into an appointment record.
   */
  async create(businessId: string, dto: CreateAppointmentDto) {
    const appointment = this.appointmentsRepository.create({
      ...dto,
      businessId,
      scheduledAt: new Date(dto.scheduledAt),
    });
    const saved = await this.appointmentsRepository.save(appointment);
    this.logger.log(`Created appointment ${saved.id} for business ${businessId} at ${saved.scheduledAt.toISOString()}`);
    return saved;
  }

  findAll(businessId: string) {
    return this.appointmentsRepository.find({ where: { businessId }, order: { scheduledAt: 'ASC' } });
  }

  async findOne(businessId: string, id: string) {
    const appointment = await this.appointmentsRepository.findOne({ where: { id, businessId } });
    if (!appointment) {
      this.logger.warn(`Appointment ${id} not found for business ${businessId}`);
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async update(businessId: string, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(businessId, id);
    Object.assign(appointment, dto);
    const saved = await this.appointmentsRepository.save(appointment);
    this.logger.log(`Updated appointment ${id} for business ${businessId}${dto.status ? ` (status=${dto.status})` : ''}`);
    return saved;
  }

  async remove(businessId: string, id: string) {
    const appointment = await this.findOne(businessId, id);
    await this.appointmentsRepository.remove(appointment);
    this.logger.log(`Removed appointment ${id} for business ${businessId}`);
  }
}
