import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { Business } from './business.entity';

@Entity('catalog_items')
export class CatalogItem extends AbstractEntity {
  @ManyToOne(() => Business, (business) => business.catalogItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ApiProperty({ description: 'ID of the business this item belongs to.', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  @Column({ name: 'business_id' })
  businessId: string;

  @ApiProperty({ description: 'Item/product/service name.', example: 'General Consultation', maxLength: 150 })
  @Column()
  name: string;

  @ApiPropertyOptional({ description: 'Item description.', example: '30-minute consultation with a general physician.', nullable: true, type: String })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Price, stored as a fixed-point decimal string (numeric(10,2)). Null means "price on request".',
    example: '500.00',
    nullable: true,
    type: String,
  })
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  price: string | null;

  @ApiProperty({ description: 'ISO 4217 currency code.', example: 'INR', default: 'INR' })
  @Column({ default: 'INR' })
  currency: string;

  @ApiPropertyOptional({ description: 'Image URL for this item.', example: 'https://cdn.example.com/items/consultation.jpg', nullable: true, type: String })
  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @ApiPropertyOptional({ description: 'Free-text category/section grouping for this item.', example: 'Consultations', nullable: true, type: String })
  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @ApiProperty({ description: 'Whether the item is currently offered/in stock.', example: true, default: true })
  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @ApiProperty({ description: 'Manual sort order for display (ascending).', example: 0, default: 0 })
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
