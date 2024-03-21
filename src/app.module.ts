import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bull';
import { SharedModule } from './shared';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from './environment';

@Module({
  imports: [
    UsersModule,
    SharedModule,
    ConfigModule.forRoot(),
    RedisModule.forRoot({
      type: 'single',
      options: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        db: 0,
      },
    }),
    BullModule.forRoot({
      redis: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
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
/**
 * AppModule
 */
export class AppModule implements NestModule {
  /**
   * Configures middleware for the application.
   * @param {MiddlewareConsumer} consumer The middleware consumer for configuration.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
