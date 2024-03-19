import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UsersModule } from './modules/users/users.module';
import { SharedModule } from './shared';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    SharedModule,
    RedisModule.forRoot({
      type: 'single',
      options: {
        host: 'localhost',
        port: 46379,
        db: 0,
      },
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 46379,
        db: 0,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
