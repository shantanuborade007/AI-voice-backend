import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneNumberAssignment } from '../phone-numbers/entities/phone-number-assignment.entity';
import { Business } from '../businesses/entities/business.entity';
import { SarvamModule } from '../ai/sarvam.module';
import { ExotelController } from './exotel.controller';
import { AudioStreamGateway } from './audio-stream.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhoneNumberAssignment, Business]),
    SarvamModule,
  ],
  controllers: [ExotelController],
  providers: [AudioStreamGateway],
})
export class TelephonyModule {}
