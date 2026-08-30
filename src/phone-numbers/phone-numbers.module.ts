import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneNumberAssignment } from './entities/phone-number-assignment.entity';
import { PhoneNumbersController } from './phone-numbers.controller';
import { PhoneNumbersService } from './phone-numbers.service';
import { ExotelService } from './exotel.service';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhoneNumberAssignment]), forwardRef(() => BusinessesModule)],
  controllers: [PhoneNumbersController],
  providers: [PhoneNumbersService, ExotelService],
  exports: [PhoneNumbersService, ExotelService],
})
export class PhoneNumbersModule {}

