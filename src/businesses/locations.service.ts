import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessLocation } from './entities/business-location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectRepository(BusinessLocation) private readonly locationsRepository: Repository<BusinessLocation>,
  ) {}

  async create(businessId: string, dto: CreateLocationDto) {
    const location = this.locationsRepository.create({ ...dto, businessId });
    const saved = await this.locationsRepository.save(location);
    this.logger.log(`Created location ${saved.id} for business ${businessId}`);
    return saved;
  }

  findAll(businessId: string) {
    return this.locationsRepository.find({ where: { businessId } });
  }

  async findOne(businessId: string, id: string) {
    const location = await this.locationsRepository.findOne({ where: { id, businessId } });
    if (!location) {
      this.logger.warn(`Location ${id} not found for business ${businessId}`);
      throw new NotFoundException('Location not found');
    }
    return location;
  }

  async update(businessId: string, id: string, dto: UpdateLocationDto) {
    const location = await this.findOne(businessId, id);
    Object.assign(location, dto);
    const saved = await this.locationsRepository.save(location);
    this.logger.log(`Updated location ${id} for business ${businessId}`);
    return saved;
  }

  async remove(businessId: string, id: string) {
    const location = await this.findOne(businessId, id);
    await this.locationsRepository.remove(location);
    this.logger.log(`Removed location ${id} for business ${businessId}`);
  }
}
