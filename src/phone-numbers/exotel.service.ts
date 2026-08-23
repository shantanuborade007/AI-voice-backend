import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Business } from '../businesses/entities/business.entity';

export interface ProvisionedNumber {
  phoneNumber: string;
  providerNumberSid: string;
}

@Injectable()
export class ExotelService {
  private readonly logger = new Logger(ExotelService.name);

  constructor(private readonly configService: ConfigService) {}

  async purchaseNumberForBusiness(business: Business): Promise<ProvisionedNumber> {
    this.logger.log(`Requesting Exotel number purchase for business ${business.id}`);
    const sid = this.configService.get<string>('EXOTEL_SID');
    const apiKey = this.configService.get<string>('EXOTEL_API_KEY');
    const apiToken = this.configService.get<string>('EXOTEL_API_TOKEN');

    if (!sid || !apiKey || !apiToken) {
      this.logger.error(`Exotel purchase aborted for business ${business.id}: credentials not configured`);
      throw new Error('Exotel credentials are not configured yet');
    }

    // TODO: POST https://api.exotel.com/v2_beta/Accounts/<sid>/IncomingPhoneNumbers
    // (basic auth apiKey:apiToken), pick a region your account's KYC covers,
    // and point the number's call flow at the Sarvam AI webhook. Map the
    // response into ProvisionedNumber below.
    this.logger.warn(`Exotel purchase not implemented yet - business ${business.id} not provisioned`);
    throw new Error('Exotel integration not implemented yet');
  }
}
