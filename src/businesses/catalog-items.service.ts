import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogItem } from './entities/catalog-item.entity';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

@Injectable()
export class CatalogItemsService {
  private readonly logger = new Logger(CatalogItemsService.name);

  constructor(@InjectRepository(CatalogItem) private readonly catalogItemsRepository: Repository<CatalogItem>) {}

  async create(businessId: string, dto: CreateCatalogItemDto) {
    const item = this.catalogItemsRepository.create({
      ...dto,
      price: dto.price !== undefined ? dto.price.toString() : null,
      businessId,
    });
    const saved = await this.catalogItemsRepository.save(item);
    this.logger.log(`Created catalog item ${saved.id} for business ${businessId}`);
    return saved;
  }

  findAll(businessId: string) {
    return this.catalogItemsRepository.find({ where: { businessId }, order: { sortOrder: 'ASC' } });
  }

  async findOne(businessId: string, id: string) {
    const item = await this.catalogItemsRepository.findOne({ where: { id, businessId } });
    if (!item) {
      this.logger.warn(`Catalog item ${id} not found for business ${businessId}`);
      throw new NotFoundException('Catalog item not found');
    }
    return item;
  }

  async update(businessId: string, id: string, dto: UpdateCatalogItemDto) {
    const item = await this.findOne(businessId, id);
    Object.assign(item, {
      ...dto,
      price: dto.price !== undefined ? dto.price.toString() : item.price,
    });
    const saved = await this.catalogItemsRepository.save(item);
    this.logger.log(`Updated catalog item ${id} for business ${businessId}`);
    return saved;
  }

  async remove(businessId: string, id: string) {
    const item = await this.findOne(businessId, id);
    await this.catalogItemsRepository.remove(item);
    this.logger.log(`Removed catalog item ${id} for business ${businessId}`);
  }
}
