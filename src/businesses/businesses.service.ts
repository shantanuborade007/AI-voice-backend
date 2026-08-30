import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);

  constructor(
    @InjectRepository(Business) private readonly businessesRepository: Repository<Business>,
    @Inject(forwardRef(() => PhoneNumbersService)) private readonly phoneNumbersService: PhoneNumbersService,
  ) {}

  async create(owner: User, dto: CreateBusinessDto): Promise<Business> {
    try {
      const business = this.businessesRepository.create({ ...dto, ownerId: owner.id });
      const saved = await this.businessesRepository.save(business);
      this.logger.log(`Created business ${saved.id} (${saved.name}) for owner ${owner.id}`);

      // Auto-provision a dedicated Exotel phone number for the newly registered business
      try {
        await this.phoneNumbersService.autoProvision(saved.id, saved);
      } catch (error) {
        this.logger.warn(`Could not auto-provision number on creation for business ${saved.id}: ${error.message}`);
      }

      return await this.findOne(saved.id);
    } catch (err) {
      this.logger.error(`Error in BusinessesService.create: ${err.message}`, err.stack);
      throw err;
    }
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
