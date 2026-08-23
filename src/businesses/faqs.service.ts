import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaqEntry } from './entities/faq-entry.entity';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  private readonly logger = new Logger(FaqsService.name);

  constructor(@InjectRepository(FaqEntry) private readonly faqsRepository: Repository<FaqEntry>) {}

  async create(businessId: string, dto: CreateFaqDto) {
    const faq = this.faqsRepository.create({ ...dto, businessId });
    const saved = await this.faqsRepository.save(faq);
    this.logger.log(`Created FAQ ${saved.id} for business ${businessId}`);
    return saved;
  }

  findAll(businessId: string) {
    return this.faqsRepository.find({ where: { businessId } });
  }

  async findOne(businessId: string, id: string) {
    const faq = await this.faqsRepository.findOne({ where: { id, businessId } });
    if (!faq) {
      this.logger.warn(`FAQ ${id} not found for business ${businessId}`);
      throw new NotFoundException('FAQ entry not found');
    }
    return faq;
  }

  async update(businessId: string, id: string, dto: UpdateFaqDto) {
    const faq = await this.findOne(businessId, id);
    Object.assign(faq, dto);
    const saved = await this.faqsRepository.save(faq);
    this.logger.log(`Updated FAQ ${id} for business ${businessId}`);
    return saved;
  }

  async remove(businessId: string, id: string) {
    const faq = await this.findOne(businessId, id);
    await this.faqsRepository.remove(faq);
    this.logger.log(`Removed FAQ ${id} for business ${businessId}`);
  }
}
