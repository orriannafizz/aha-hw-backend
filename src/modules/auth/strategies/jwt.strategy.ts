import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWT_SECRET } from '../../../environment';

@Injectable()
/**
 * Jwt strategy to validate the token.
 */
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * The Jwt strategy constructor.
   */
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  /**
   * @param {{sub: string, username: string}} payload The payload to validate.
   * @return {Promise<{id: string, username: string}>} The validation result.
   */
  async validate(payload: { sub: string; username: string }) {
    return { id: payload.sub, username: payload.username };
  }
}
