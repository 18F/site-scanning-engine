import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { TaskService } from './task/task.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MessageQueueModule } from '@app/message-queue';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [
    DatabaseModule,
    MessageQueueModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  providers: [ProducerService, TaskService],
})
export class ProducerModule {}
