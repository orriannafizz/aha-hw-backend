import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { PrismaService } from './shared/prisma/prisma.service';

@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      options: {
        host: 'localhost',
        port: 46379,
        db: 0,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
