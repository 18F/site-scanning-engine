import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SCANNER_QUEUE_NAME } from '../../../const/const';
import { CoreScanner } from '../scanners/core/core.scanner';
import { ScannersModule } from '../scanners/scanners.module';
import { ScanEngineConsumer } from './scan-engine.consumer';

@Module({
  imports: [
    ScannersModule,
    BullModule.registerQueueAsync({
      name: SCANNER_QUEUE_NAME,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CoreScanner, ScanEngineConsumer],
})
export class ScanEngineModule {}
