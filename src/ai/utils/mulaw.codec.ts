import { mulaw } from 'alawmulaw';

/**
 * Decodes 8kHz mu-law (G.711) audio buffer into 16-bit PCM little-endian Buffer.
 */
export function mulawToPcm16(mulawBuffer: Buffer): Buffer {
  const samples: Int16Array = mulaw.decode(mulawBuffer);
  return Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
}

/**
 * Encodes 16-bit PCM little-endian Buffer into 8kHz mu-law Buffer.
 */
export function pcm16ToMulaw(pcmBuffer: Buffer): Buffer {
  const sampleCount = Math.floor(pcmBuffer.length / 2);
  const int16Samples = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i++) {
    int16Samples[i] = pcmBuffer.readInt16LE(i * 2);
  }

  const encodedSamples: Uint8Array = mulaw.encode(int16Samples);
  return Buffer.from(encodedSamples);
}
