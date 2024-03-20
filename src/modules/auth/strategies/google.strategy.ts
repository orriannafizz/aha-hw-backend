import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { GoogleUserEntity } from '@/modules/auth/entities/google-user.entity';
import {
  BACKEND_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '@/environment';

@Injectable()
/**
 * Google OAuth strategy.
 */
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  /**
   * The Google strategy constructor.
   */
  constructor() {
    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/auth/google/callback`,
      passReqToCallback: false,
      scope: ['email', 'profile'],
    });
  }

  /**
   * @param {string} accessToken the access token from google
   * @param {string} refreshToken the refresh token from google
   * @param {any} profile the user profile from google, e.g. email, photos, id, displayName
   * @param {VerifyCallback} done the callback function to call after the validation
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, photos, id, displayName } = profile;
    const user: GoogleUserEntity = {
      id,
      username: displayName,
      email: emails[0].value,
      picture: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}
