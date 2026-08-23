import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(@InjectRepository(Business) private readonly businessesRepository: Repository<Business>) {}

  async create(owner: User, dto: CreateBusinessDto): Promise<Business> {
    const business = this.businessesRepository.create({ ...dto, ownerId: owner.id });
    const saved = await this.businessesRepository.save(business);
    this.logger.log(`Created business ${saved.id} (${saved.name}) for owner ${owner.id}`);
    return saved;
  }

  findAllForUser(user: User): Promise<Business[]> {
    if (user.role === UserRole.ADMIN) {
      return this.businessesRepository.find();
    }
    return this.businessesRepository.find({ where: { ownerId: user.id } });
  }

  async findOne(id: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({
      where: { id },
      relations: [
        'locations',
        'catalogItems',
        'faqEntries',
        'availabilitySlots',
        'subscription',
        'subscription.plan',
        'phoneNumberAssignment',
      ],
    });
    if (!business) {
      this.logger.warn(`Business ${id} not found`);
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async update(id: string, dto: UpdateBusinessDto): Promise<Business> {
    const business = await this.findOne(id);
    Object.assign(business, dto);
    const saved = await this.businessesRepository.save(business);
    this.logger.log(`Updated business ${id}`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const business = await this.findOne(id);
    await this.businessesRepository.remove(business);
    this.logger.log(`Removed business ${id}`);
  }
}
