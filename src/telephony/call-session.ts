import { WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { SarvamClient, ChatMessage } from '../ai/sarvam.client';
import { mulawToPcm16, pcm16ToMulaw } from '../ai/utils/mulaw.codec';
import {
  wrapPcmInWavHeader,
  stripWavHeader,
  chunkBuffer,
  TurnSilenceDetector,
} from '../ai/utils/audio.utils';
import { Business } from '../businesses/entities/business.entity';

export interface CallSessionOptions {
  streamSid: string;
  callSid: string;
  ws: WebSocket;
  sarvamClient: SarvamClient;
  business?: Business | null;
  botLanguage?: string;
  botSpeaker?: string;
  silenceMs?: number;
}

export class CallSession {
  private readonly logger = new Logger(CallSession.name);

  public streamSid: string;
  public callSid: string;
  private ws: WebSocket;
  private sarvamClient: SarvamClient;
  private silenceDetector: TurnSilenceDetector;

  private botLanguage: string;
  private botSpeaker: string;
  private business?: Business | null;

  private chatHistory: ChatMessage[] = [];
  private isProcessingTurn: boolean = false;

  constructor(options: CallSessionOptions) {
    this.streamSid = options.streamSid;
    this.callSid = options.callSid;
    this.ws = options.ws;
    this.sarvamClient = options.sarvamClient;
    this.business = options.business;

    this.botLanguage = options.botLanguage || process.env.BOT_LANGUAGE || 'hi-IN';
    this.botSpeaker = options.botSpeaker || process.env.BOT_SPEAKER || 'ritu';

    const silenceMs = options.silenceMs || parseInt(process.env.SILENCE_MS || '700', 10);
    this.silenceDetector = new TurnSilenceDetector(silenceMs, 400);

    this.initSystemPrompt();
  }

  /**
   * Builds the System Prompt dynamically using business context or baseline fallback.
   */
  private initSystemPrompt(): void {
    if (this.business) {
      const b = this.business;
      const faqsFormatted = (b.faqEntries || [])
        .filter((f) => f.isActive !== false)
        .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
        .join('\n\n');

      const catalogFormatted = (b.catalogItems || [])
        .filter((c) => c.isAvailable)
        .map((c) => `- ${c.name} (${c.price ? '₹' + c.price : 'Price on request'}): ${c.description || ''}`)
        .join('\n');

      const systemPromptContent = `
You are an AI voice receptionist for "${b.name}" (${b.category || 'Business'}).
${b.description ? 'Description: ' + b.description : ''}

Knowledge Base & FAQs:
${faqsFormatted || 'No specific FAQs provided.'}

Catalog & Services:
${catalogFormatted || 'No specific catalog items listed.'}

Instructions:
1. Speak in a natural, polite, and conversational tone matching the language of the caller.
2. Keep all responses brief (1 to 2 short sentences maximum) as this is a live phone call.
3. Help the caller with information about ${b.name}. If they ask to speak to a human or manager, acknowledge their request politely.
      `.trim();

      this.chatHistory.push({ role: 'system', content: systemPromptContent });
      this.logger.log(`Initialized dynamic system prompt for Business [${b.name}] (ID: ${b.id})`);
    } else {
      const baselinePrompt = `
You are an AI assistant powered by Exotel and Sarvam AI.
This is a baseline integration test call.
Greetings! Welcome the caller warmly, confirm that the Exotel telephony and Sarvam AI voice integration is working successfully, and keep your responses short (1-2 sentences).
      `.trim();

      this.chatHistory.push({ role: 'system', content: baselinePrompt });
      this.logger.log(`Initialized baseline test system prompt for Call SID [${this.callSid}]`);
    }
  }

  /**
   * Processes incoming base64 mu-law audio chunk from Exotel WebSocket.
   */
  public async onMediaChunk(base64Payload: string): Promise<void> {
    if (this.isProcessingTurn) {
      return;
    }

    const mulawBuffer = Buffer.from(base64Payload, 'base64');
    const pcmChunk = mulawToPcm16(mulawBuffer);

    this.silenceDetector.addChunk(pcmChunk, 20);

    if (this.silenceDetector.isTurnComplete()) {
      this.isProcessingTurn = true;
      const turnPcmBuffer = this.silenceDetector.getAudioBuffer();
      this.silenceDetector.reset();

      this.processTurn(turnPcmBuffer).catch((err) => {
        this.logger.error(`[Call ${this.callSid}] Error in turn processing: ${err?.message || err}`);
        this.isProcessingTurn = false;
      });
    }
  }

  /**
   * Full Voice Loop: PCM -> Sarvam STT -> Sarvam Chat LLM -> Sarvam TTS -> Exotel WebSocket.
   */
  private async processTurn(pcmAudioBuffer: Buffer): Promise<void> {
    try {
      this.logger.log(`[Call ${this.callSid}] ⏳ Processing audio turn (${pcmAudioBuffer.length} bytes PCM)...`);

      // 1. STT
      const wavBuffer = wrapPcmInWavHeader(pcmAudioBuffer, 8000, 1, 16);
      const transcript = await this.sarvamClient.speechToText(wavBuffer, this.botLanguage);
      const trimmedTranscript = transcript.trim();

      if (!trimmedTranscript) {
        this.logger.log(`[Call ${this.callSid}] ⚠️ No clear transcript detected.`);
        this.isProcessingTurn = false;
        return;
      }

      this.logger.log(`[Call ${this.callSid}] 🎙️ Caller said: "${trimmedTranscript}"`);
      this.chatHistory.push({ role: 'user', content: trimmedTranscript });
      this.pruneChatHistory();

      // 2. LLM Reply
      const rawReply = await this.sarvamClient.chatCompletion(this.chatHistory);
      const cleanReply = rawReply.trim();
      this.logger.log(`[Call ${this.callSid}] 🤖 AI Reply: "${cleanReply}"`);
      this.chatHistory.push({ role: 'assistant', content: cleanReply });

      // 3. TTS Output
      const ttsWavBuffer = await this.sarvamClient.textToSpeech(
        cleanReply,
        this.botLanguage,
        this.botSpeaker,
        8000,
      );

      const ttsPcmBuffer = stripWavHeader(ttsWavBuffer);
      const ttsMulawBuffer = pcm16ToMulaw(ttsPcmBuffer);
      const chunks = chunkBuffer(ttsMulawBuffer, 160);

      this.logger.log(`[Call ${this.callSid}] 📤 Streaming ${chunks.length} audio frames to caller...`);

      for (const chunk of chunks) {
        if (this.ws.readyState === WebSocket.OPEN) {
          const mediaMessage = {
            event: 'media',
            streamSid: this.streamSid,
            media: {
              payload: chunk.toString('base64'),
            },
          };
          this.ws.send(JSON.stringify(mediaMessage));
        }
      }
    } catch (err: any) {
      this.logger.error(`[Call ${this.callSid}] Turn execution error: ${err?.message || err}`);
    } finally {
      this.isProcessingTurn = false;
    }
  }

  private pruneChatHistory(): void {
    if (this.chatHistory.length > 13) {
      const systemPrompt = this.chatHistory[0];
      const recentMessages = this.chatHistory.slice(-12);
      this.chatHistory = [systemPrompt, ...recentMessages];
    }
  }

  public destroy(): void {
    this.logger.log(`[Call ${this.callSid}] Call session ended.`);
  }
}
