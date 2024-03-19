import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bull';
import { SharedModule } from './shared';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    UsersModule,
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
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
