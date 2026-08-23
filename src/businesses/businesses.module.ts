import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessLocation } from './entities/business-location.entity';
import { CatalogItem } from './entities/catalog-item.entity';
import { FaqEntry } from './entities/faq-entry.entity';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { Appointment } from './entities/appointment.entity';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { CatalogItemsController } from './catalog-items.controller';
import { CatalogItemsService } from './catalog-items.service';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { BusinessOwnershipGuard } from './guards/business-ownership.guard';

const typeOrmFeatureModule = TypeOrmModule.forFeature([
  Business,
  BusinessLocation,
  CatalogItem,
  FaqEntry,
  AvailabilitySlot,
  Appointment,
]);

@Module({
  imports: [typeOrmFeatureModule],
  controllers: [
    BusinessesController,
    LocationsController,
    CatalogItemsController,
    FaqsController,
    AvailabilityController,
    AppointmentsController,
  ],
  providers: [
    BusinessesService,
    LocationsService,
    CatalogItemsService,
    FaqsService,
    AvailabilityService,
    AppointmentsService,
    BusinessOwnershipGuard,
  ],
  exports: [BusinessesService, BusinessOwnershipGuard, typeOrmFeatureModule],
})
export class BusinessesModule {}
