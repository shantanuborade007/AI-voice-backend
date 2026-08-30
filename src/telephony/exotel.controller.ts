import { Controller, Get, Post, All, Req, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhoneNumberAssignment } from '../phone-numbers/entities/phone-number-assignment.entity';

@ApiTags('Telephony')
@Controller('telephony/exotel')
export class ExotelController {
  private readonly logger = new Logger(ExotelController.name);

  constructor(
    @InjectRepository(PhoneNumberAssignment)
    private readonly phoneNumRepo: Repository<PhoneNumberAssignment>,
  ) {}

  @All('incoming')
  @ApiOperation({
    summary: 'Exotel Inbound Call Webhook',
    description:
      'Receives Exotel Passthru HTTP webhook (GET or POST) when an ExoPhone receives an incoming call. ' +
      'Looks up the assigned business by called ExoPhone number and returns ExoML XML instructing Exotel to open a WebSocket audio stream.',
  })
  @ApiResponse({ status: 200, description: 'ExoML XML response instructing stream connection' })
  async handleIncomingCall(@Req() req: Request, @Res() res: Response) {
    const body = req.body || {};
    const query = req.query || {};

    const callSid = body.CallSid || body.Sid || query.CallSid || query.Sid || `CALL_${Date.now()}`;
    const caller = body.From || query.From || 'UNKNOWN_CALLER';
    const calledExoPhone = body.To || body.ExoPhone || query.To || query.ExoPhone || '';

    const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000') as string;
    const protocol = req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'wss' : 'ws';

    this.logger.log(`📞 Incoming Exotel call [${callSid}] from [${caller}] to ExoPhone [${calledExoPhone}] on host [${host}]`);

    let businessId = '';

    if (calledExoPhone) {
      // Clean phone number format for lookup if needed
      const assignment = await this.phoneNumRepo.findOne({
        where: [{ phoneNumber: calledExoPhone }],
        relations: ['business'],
      });

      if (assignment?.business) {
        businessId = assignment.business.id;
        this.logger.log(`Matched ExoPhone [${calledExoPhone}] to Business ID [${businessId}] (${assignment.business.name})`);
      } else {
        this.logger.warn(`No active business assignment found for ExoPhone [${calledExoPhone}]. Falling back to baseline test mode.`);
      }
    }

    const streamUrl = businessId
      ? `${protocol}://${host}/api/v1/telephony/stream?businessId=${businessId}&callSid=${callSid}`
      : `${protocol}://${host}/api/v1/telephony/stream?callSid=${callSid}`;

    // Escape '&' in XML URL query parameters
    const xmlStreamUrl = streamUrl.replace(/&/g, '&amp;');

    const exoXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${xmlStreamUrl}" />
    </Connect>
</Response>`;

    res.type('text/xml').send(exoXml);
  }
}
