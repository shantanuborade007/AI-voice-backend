/**
 * Wraps 16-bit PCM raw audio in a 44-byte standard RIFF WAV header.
 */
export function wrapPcmInWavHeader(
  pcmBuffer: Buffer,
  sampleRate: number = 8000,
  numChannels: number = 1,
  bitsPerSample: number = 16,
): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Extracts raw PCM audio payload from a WAV Buffer by stripping the WAV header.
 */
export function stripWavHeader(wavBuffer: Buffer): Buffer {
  if (wavBuffer.length < 44) {
    return wavBuffer;
  }

  const dataIndex = wavBuffer.indexOf('data');
  if (dataIndex !== -1 && dataIndex + 8 <= wavBuffer.length) {
    const dataSize = wavBuffer.readUInt32LE(dataIndex + 4);
    const start = dataIndex + 8;
    const end = Math.min(start + dataSize, wavBuffer.length);
    return wavBuffer.subarray(start, end);
  }

  return wavBuffer.subarray(44);
}

/**
 * Calculates Root Mean Square (RMS) energy for 16-bit PCM audio samples.
 */
export function calculateRms(pcmBuffer: Buffer): number {
  const sampleCount = Math.floor(pcmBuffer.length / 2);
  if (sampleCount === 0) return 0;

  let sumSquare = 0;
  for (let i = 0; i < sampleCount; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    sumSquare += sample * sample;
  }

  return Math.sqrt(sumSquare / sampleCount);
}

/**
 * Splits a Buffer into chunks of specified size (default: 160 bytes = 20ms @ 8kHz mulaw).
 */
export function chunkBuffer(buffer: Buffer, chunkSize: number = 160): Buffer[] {
  const chunks: Buffer[] = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.subarray(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Helper class for accumulating turn audio and detecting end of speech based on silence.
 */
export class TurnSilenceDetector {
  private silenceThreshold: number;
  private silenceMsRequired: number;
  private pcmChunks: Buffer[] = [];
  private accumulatedSilenceMs: number = 0;
  private totalAudioMs: number = 0;
  private hasSpoken: boolean = false;

  constructor(silenceMsRequired: number = 700, silenceThreshold: number = 400) {
    this.silenceMsRequired = silenceMsRequired;
    this.silenceThreshold = silenceThreshold;
  }

  public addChunk(pcmChunk: Buffer, chunkDurationMs: number = 20): void {
    this.pcmChunks.push(pcmChunk);
    this.totalAudioMs += chunkDurationMs;

    const rms = calculateRms(pcmChunk);

    if (rms > this.silenceThreshold) {
      this.hasSpoken = true;
      this.accumulatedSilenceMs = 0;
    } else {
      if (this.hasSpoken) {
        this.accumulatedSilenceMs += chunkDurationMs;
      }
    }
  }

  public isTurnComplete(): boolean {
    return (
      this.hasSpoken &&
      this.totalAudioMs >= 400 &&
      this.accumulatedSilenceMs >= this.silenceMsRequired
    );
  }

  public getAudioBuffer(): Buffer {
    return Buffer.concat(this.pcmChunks);
  }

  public reset(): void {
    this.pcmChunks = [];
    this.accumulatedSilenceMs = 0;
    this.totalAudioMs = 0;
    this.hasSpoken = false;
  }
}
