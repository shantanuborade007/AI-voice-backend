import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class SarvamClient {
  private readonly logger = new Logger(SarvamClient.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SARVAM_AI_API_KEY', '');
    if (!this.apiKey || this.apiKey === 'your_sarvam_key_here') {
      this.logger.warn('⚠️ SARVAM_AI_API_KEY is missing or unconfigured in environment.');
    }
  }

  /**
   * Transcribes 16-bit PCM WAV audio to text using Sarvam STT (saarika:v2.5).
   */
  public async speechToText(wavBuffer: Buffer, languageCode: string = 'hi-IN'): Promise<string> {
    const form = new FormData();
    form.append('file', wavBuffer, {
      filename: 'speech.wav',
      contentType: 'audio/wav',
    });
    form.append('model', 'saarika:v2.5');
    form.append('language_code', languageCode);

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
        ...form.getHeaders(),
      },
      body: form as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam STT Error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as { transcript?: string };
    return data.transcript || '';
  }

  /**
   * Generates LLM response using Sarvam Chat LLM (sarvam-105b-conversations).
   */
  public async chatCompletion(messages: ChatMessage[]): Promise<string> {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: messages,
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam Chat LLM Error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('Sarvam Chat LLM returned an empty response.');
    }

    return reply;
  }

  /**
   * Converts text into spoken audio Buffer using Sarvam TTS (bulbul:v3).
   */
  public async textToSpeech(
    text: string,
    targetLanguageCode: string = 'hi-IN',
    speaker: string = 'ritu',
    sampleRate: number = 8000,
  ): Promise<Buffer> {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        target_language_code: targetLanguageCode,
        model: 'bulbul:v3',
        speaker: speaker,
        pace: 1.0,
        enable_preprocessing: true,
        speech_sample_rate: sampleRate,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam TTS Error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as { audios?: string[] };
    const base64Wav = data.audios?.[0];

    if (!base64Wav) {
      throw new Error('Sarvam TTS returned no audio data.');
    }

    return Buffer.from(base64Wav, 'base64');
  }
}
