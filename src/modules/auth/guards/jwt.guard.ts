import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
/**
 * Jwt authentication guard.
 */
export class JwtAuthGuard extends AuthGuard('jwt') {}
