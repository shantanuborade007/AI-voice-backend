import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(@InjectRepository(SubscriptionPlan) private readonly plansRepository: Repository<SubscriptionPlan>) {}

  findAllActive() {
    return this.plansRepository.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async findOne(id: string) {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) {
      this.logger.warn(`Plan ${id} not found`);
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async create(dto: CreatePlanDto) {
    const plan = this.plansRepository.create({ ...dto, priceMonthly: dto.priceMonthly.toString() });
    const saved = await this.plansRepository.save(plan);
    this.logger.log(`Created subscription plan ${saved.id} (${saved.name})`);
    return saved;
  }
}
