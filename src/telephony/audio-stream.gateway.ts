import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { PhoneNumberAssignment } from '../phone-numbers/entities/phone-number-assignment.entity';
import { SarvamClient } from '../ai/sarvam.client';
import { CallSession } from './call-session';

@Injectable()
export class AudioStreamGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AudioStreamGateway.name);
  private wss: WebSocketServer;
  private activeSessions = new Map<string, CallSession>();

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(PhoneNumberAssignment)
    private readonly phoneNumRepo: Repository<PhoneNumberAssignment>,
    private readonly sarvamClient: SarvamClient,
  ) {}

  onModuleInit() {
    const server = this.httpAdapterHost.httpAdapter.getHttpServer();
    if (!server) {
      this.logger.error('Failed to retrieve HTTP Server for WebSocket upgrade handling.');
      return;
    }

    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request: IncomingMessage, socket: any, head: Buffer) => {
      const host = request.headers.host || 'localhost:3000';
      const reqUrl = new URL(request.url || '', `http://${host}`);
      const pathname = reqUrl.pathname;

      if (
        pathname === '/api/v1/telephony/stream' ||
        pathname === '/telephony/stream' ||
        pathname === '/media'
      ) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    this.logger.log('📡 AudioStreamGateway WebSocket server initialized at route: /api/v1/telephony/stream');
  }

  private async handleConnection(ws: WebSocket, request: IncomingMessage) {
    this.logger.log('📡 Incoming Exotel Media Stream WebSocket connection...');

    const host = request.headers.host || 'localhost:3000';
    const reqUrl = new URL(request.url || '', `http://${host}`);
    const businessId = reqUrl.searchParams.get('businessId') || '';
    const initialCallSid = reqUrl.searchParams.get('callSid') || `CALL_${Date.now()}`;

    let loadedBusiness: Business | null = null;

    if (businessId) {
      try {
        loadedBusiness = await this.businessRepo.findOne({
          where: { id: businessId },
          relations: ['locations', 'catalogItems', 'faqEntries', 'availabilitySlots'],
        });
        if (loadedBusiness) {
          this.logger.log(`Loaded business profile [${loadedBusiness.name}] for voice session.`);
        }
      } catch (err: any) {
        this.logger.error(`Error loading business [${businessId}]: ${err?.message || err}`);
      }
    }

    let currentStreamSid: string | null = null;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        switch (data.event) {
          case 'connected':
            this.logger.log(`✅ Exotel Stream Connected: ${JSON.stringify(data)}`);
            break;

          case 'start': {
            const startObj = data.start || data;
            const streamSid = data.streamSid || startObj.streamSid || `STREAM_${Date.now()}`;
            const callSid = startObj.callSid || initialCallSid;
            currentStreamSid = streamSid;

            this.logger.log(`🚀 Call Stream Started — StreamSid: ${streamSid}, CallSid: ${callSid}`);

            // Fallback: If businessId query parameter was missing, search by called ExoPhone in payload
            if (!loadedBusiness) {
              const calledExoPhone =
                startObj.to ||
                startObj.ExoPhone ||
                startObj.calledExoPhone ||
                startObj.customParameters?.to ||
                '';

              if (calledExoPhone) {
                try {
                  const assignment = await this.phoneNumRepo.findOne({
                    where: { phoneNumber: calledExoPhone },
                    relations: ['business', 'business.locations', 'business.catalogItems', 'business.faqEntries', 'business.availabilitySlots'],
                  });
                  if (assignment?.business) {
                    loadedBusiness = assignment.business;
                    this.logger.log(`Matched ExoPhone [${calledExoPhone}] from start payload to Business [${loadedBusiness.name}]`);
                  }
                } catch (err: any) {
                  this.logger.error(`Error looking up business by ExoPhone [${calledExoPhone}]: ${err?.message || err}`);
                }
              }
            }

            const session = new CallSession({
              streamSid,
              callSid,
              ws,
              sarvamClient: this.sarvamClient,
              business: loadedBusiness,
            });

            this.activeSessions.set(streamSid, session);

            // Automatically trigger initial AI greeting playback over WebSocket
            session.playInitialGreeting().catch((err) => {
              this.logger.error(`Error playing initial greeting: ${err?.message || err}`);
            });
            break;
          }

          case 'media': {
            if (currentStreamSid && this.activeSessions.has(currentStreamSid)) {
              const session = this.activeSessions.get(currentStreamSid)!;
              const payload = data.media?.payload || data.payload;
              if (payload) {
                await session.onMediaChunk(payload);
              }
            }
            break;
          }

          case 'stop': {
            const streamSid = data.streamSid || data.stop?.streamSid || data.stream_sid || currentStreamSid;
            this.logger.log(`🛑 Call Stream Stopped — StreamSid: ${streamSid}`);
            if (currentStreamSid && this.activeSessions.has(currentStreamSid)) {
              const session = this.activeSessions.get(currentStreamSid)!;
              session.destroy();
              this.activeSessions.delete(currentStreamSid);
            }
            break;
          }

          default:
            break;
        }
      } catch (err: any) {
        this.logger.error(`Error parsing WebSocket message: ${err?.message || err}`);
      }
    });

    ws.on('close', () => {
      this.logger.log('🔌 Exotel Media Stream WebSocket disconnected.');
      if (currentStreamSid && this.activeSessions.has(currentStreamSid)) {
        const session = this.activeSessions.get(currentStreamSid)!;
        session.destroy();
        this.activeSessions.delete(currentStreamSid);
      }
    });

    ws.on('error', (err) => {
      this.logger.error(`WebSocket Stream Error: ${err?.message || err}`);
    });
  }

  onModuleDestroy() {
    if (this.wss) {
      this.wss.close();
    }
  }
}
