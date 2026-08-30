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
    this.logger.log(`Requesting Exotel number purchase for business ${business.id} (${business.name})`);
    const sid = this.configService.get<string>('EXOTEL_SID');
    const apiKey = this.configService.get<string>('EXOTEL_API_KEY');
    const apiToken = this.configService.get<string>('EXOTEL_API_TOKEN');
    const subdomain = this.configService.get<string>('EXOTEL_SUBDOMAIN', 'api.exotel.com');
    const voiceUrl = this.configService.get<string>('EXOTEL_VOICE_URL');

    if (sid && apiKey && apiToken) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
        const baseUrl = `https://${subdomain}/v2_beta/Accounts/${sid}`;

        // Strategy 1: Check existing IncomingPhoneNumbers in Exotel account inventory
        try {
          const listRes = await fetch(`${baseUrl}/IncomingPhoneNumbers`, {
            method: 'GET',
            headers: { Authorization: authHeader, Accept: 'application/json' },
          });
          if (listRes.ok) {
            const listData = await listRes.json();
            const existingNumbers = listData?.IncomingPhoneNumbers || listData?.Numbers || [];
            if (Array.isArray(existingNumbers) && existingNumbers.length > 0) {
              // Find an unassigned ExoPhone or pick an inventory number
              const candidate = existingNumbers.find(
                (n: any) => !n.FriendlyName || n.FriendlyName.includes('Unassigned') || n.FriendlyName.includes('Pool')
              ) || existingNumbers[0];

              const phoneNumber = candidate.PhoneNumber || candidate.phone_number;
              const providerNumberSid = candidate.Sid || candidate.sid || `exo_${Date.now()}`;

              if (phoneNumber) {
                this.logger.log(
                  `[POOL ALLOCATION] Assigned existing Exotel inventory number ${phoneNumber} (sid=${providerNumberSid}) to business ${business.id}`
                );
                return { phoneNumber, providerNumberSid };
              }
            }
          }
        } catch (err: any) {
          this.logger.debug(`Could not query Exotel account number pool: ${err?.message || err}`);
        }

        // Strategy 2: Query available numbers for on-demand purchase
        let targetPhoneNumber: string | null = null;
        try {
          const availRes = await fetch(`${baseUrl}/AvailablePhoneNumbers`, {
            method: 'GET',
            headers: { Authorization: authHeader, Accept: 'application/json' },
          });
          if (availRes.ok) {
            const availData = await availRes.json();
            const numbers = availData?.Numbers || availData?.AvailablePhoneNumbers || [];
            if (Array.isArray(numbers) && numbers.length > 0) {
              targetPhoneNumber = numbers[0].PhoneNumber || numbers[0].phone_number;
              this.logger.log(`Found available Exotel number to purchase: ${targetPhoneNumber}`);
            }
          }
        } catch (err: any) {
          this.logger.debug(`Could not fetch available numbers list: ${err?.message || err}`);
        }

        // Strategy 3: Post to IncomingPhoneNumbers to purchase/assign the ExoPhone with VoiceUrl auto-binding
        const bodyParams = new URLSearchParams();
        bodyParams.append('FriendlyName', `Business: ${business.name}`);
        if (targetPhoneNumber) {
          bodyParams.append('PhoneNumber', targetPhoneNumber);
        }
        if (voiceUrl) {
          bodyParams.append('VoiceUrl', voiceUrl);
        }

        const response = await fetch(`${baseUrl}/IncomingPhoneNumbers`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: bodyParams.toString(),
        });

        if (response.ok) {
          const data = await response.json();
          const incomingNumber = data?.IncomingPhoneNumber || data;
          const phoneNumber = incomingNumber?.PhoneNumber || incomingNumber?.phone_number || targetPhoneNumber;
          const providerNumberSid = incomingNumber?.Sid || incomingNumber?.sid || `exo_${Date.now()}`;

          if (phoneNumber) {
            this.logger.log(
              `Successfully purchased Exotel number ${phoneNumber} (sid=${providerNumberSid}) for business ${business.id}`
            );
            return { phoneNumber, providerNumberSid };
          }
        } else {
          const errText = await response.text();
          this.logger.warn(`Exotel API provisioning returned status ${response.status}: ${errText}`);
        }
      } catch (error: any) {
        this.logger.error(`Exotel API purchase call failed: ${error?.message || error}`);
      }
    } else {
      this.logger.warn(`Exotel credentials not fully configured; using development provisioner.`);
    }

    // Default ExoPhone fallback from .env if configured
    const defaultExoPhone = this.configService.get<string>('EXOTEL_DEFAULT_EXOPHONE');
    if (defaultExoPhone) {
      this.logger.log(`[DEFAULT EXOPHONE FALLBACK] Assigned default ExoPhone ${defaultExoPhone} to business ${business.id}`);
      return {
        phoneNumber: defaultExoPhone,
        providerNumberSid: `exo_default_${Date.now()}`,
      };
    }

    // Sandbox / Local Development Fallback:
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const mockPhoneNumber = `+918045${randomSuffix}`;
    const mockSid = `exo_dev_${Date.now()}_${randomSuffix}`;

    this.logger.warn(`[DEV FALLBACK] Provisioned mock dedicated number ${mockPhoneNumber} for business ${business.id}`);
    return {
      phoneNumber: mockPhoneNumber,
      providerNumberSid: mockSid,
    };

  }
}

