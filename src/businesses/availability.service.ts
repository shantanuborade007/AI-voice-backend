import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(@InjectRepository(AvailabilitySlot) private readonly slotsRepository: Repository<AvailabilitySlot>) {}

  async create(businessId: string, dto: CreateAvailabilitySlotDto) {
    const slot = this.slotsRepository.create({ ...dto, businessId });
    const saved = await this.slotsRepository.save(slot);
    this.logger.log(`Created availability slot ${saved.id} for business ${businessId}`);
    return saved;
  }

  findAll(businessId: string) {
    return this.slotsRepository.find({ where: { businessId }, order: { dayOfWeek: 'ASC', startTime: 'ASC' } });
  }

  async remove(businessId: string, id: string) {
    const slot = await this.slotsRepository.findOne({ where: { id, businessId } });
    if (!slot) {
      this.logger.warn(`Availability slot ${id} not found for business ${businessId}`);
      throw new NotFoundException('Availability slot not found');
    }
    await this.slotsRepository.remove(slot);
    this.logger.log(`Removed availability slot ${id} for business ${businessId}`);
  }
}
