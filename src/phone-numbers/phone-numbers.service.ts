import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PhoneNumberAssignment } from './entities/phone-number-assignment.entity';
import { AssignPhoneNumberDto } from './dto/assign-phone-number.dto';
import { PhoneNumberStatus } from '../common/enums/phone-number-status.enum';
import { ExotelService } from './exotel.service';
import { Business } from '../businesses/entities/business.entity';

@Injectable()
export class PhoneNumbersService {
  private readonly logger = new Logger(PhoneNumbersService.name);

  constructor(
    @InjectRepository(PhoneNumberAssignment)
    private readonly assignmentsRepository: Repository<PhoneNumberAssignment>,
    private readonly configService: ConfigService,
    private readonly exotelService: ExotelService,
  ) {}

  async findForBusiness(businessId: string) {
    let assignment = await this.assignmentsRepository.findOne({ where: { businessId } });
    if (!assignment) {
      // Exotel account KYC is a one-time, platform-level fact - not
      // per-business - so it's read from config rather than always
      // defaulting new assignments to pending_kyc.
      const kycApproved = this.configService.get<string>('EXOTEL_ACCOUNT_KYC_APPROVED', 'false') === 'true';
      assignment = this.assignmentsRepository.create({
        businessId,
        status: kycApproved ? PhoneNumberStatus.PENDING_ASSIGNMENT : PhoneNumberStatus.PENDING_KYC,
      });
      assignment = await this.assignmentsRepository.save(assignment);
      this.logger.log(`Created phone number assignment for business ${businessId} with status ${assignment.status}`);
    }
    return assignment;
  }

  /**
   * Called right after a business's subscription is activated. Purchases
   * and maps a number via Exotel if one isn't already active.
   */
  async autoProvision(businessId: string, business: Business) {
    const assignment = await this.findForBusiness(businessId);
    if (assignment.status === PhoneNumberStatus.ACTIVE) {
      this.logger.log(`Business ${businessId} already has an active number, skipping auto-provision`);
      return assignment;
    }

    this.logger.log(`Auto-provisioning a number for business ${businessId} (current status=${assignment.status})`);
    const provisioned = await this.exotelService.purchaseNumberForBusiness(business);
    assignment.phoneNumber = provisioned.phoneNumber;
    assignment.providerNumberSid = provisioned.providerNumberSid;
    assignment.status = PhoneNumberStatus.ACTIVE;
    assignment.assignedAt = new Date();
    const saved = await this.assignmentsRepository.save(assignment);
    this.logger.log(`Auto-provisioned ${saved.phoneNumber} (sid=${saved.providerNumberSid}) for business ${businessId}`);
    return saved;
  }

  /**
   * Admin-only. Call once Exotel KYC is approved and a number has been
   * purchased/mapped in the Exotel dashboard for this business.
   */
  async assign(businessId: string, dto: AssignPhoneNumberDto) {
    const assignment = await this.findForBusiness(businessId);
    assignment.phoneNumber = dto.phoneNumber;
    assignment.providerNumberSid = dto.providerNumberSid ?? assignment.providerNumberSid;
    assignment.status = dto.status ?? PhoneNumberStatus.ACTIVE;
    assignment.notes = dto.notes ?? assignment.notes;
    assignment.assignedAt = new Date();
    const saved = await this.assignmentsRepository.save(assignment);
    this.logger.log(`Admin assigned ${saved.phoneNumber} to business ${businessId} (status=${saved.status})`);
    return saved;
  }
}
