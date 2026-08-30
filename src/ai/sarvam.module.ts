import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SarvamClient } from './sarvam.client';

@Module({
  imports: [ConfigModule],
  providers: [SarvamClient],
  exports: [SarvamClient],
})
export class SarvamModule {}
