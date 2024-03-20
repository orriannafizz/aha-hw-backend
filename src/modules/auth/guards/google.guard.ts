import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
/**
 * Google OAuth guard.
 */
export class GoogleOAuthGuard extends AuthGuard('google') {
  /**
   * @param {ConfigService} configService The configuration service.
   */
  constructor(private configService: ConfigService) {
    super({
      accessType: 'offline',
    });
  }
}
