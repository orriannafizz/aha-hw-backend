import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { MailProcessor } from './mail/mail.processor';
import { EMAIL_QUEUE } from 'src/constants';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE.QUEUE,
      // Send grid's rate limit is 600 per minute
      limiter: {
        max: 600,
        duration: 60 * 1000, // 1 minute
      },
    }),
  ],
  providers: [PrismaService, MailProcessor],
  exports: [BullModule, PrismaService],
})
export class SharedModule {}
