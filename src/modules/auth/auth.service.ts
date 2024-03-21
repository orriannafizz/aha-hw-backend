import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { GoogleUserEntity } from './entities/google-user.entity';
import * as bcrypt from 'bcrypt';
import { TokensEntity } from './entities/tokens.entity';
import { DailyStatics, User } from '@prisma/client';

@Injectable()
/**
 * Service responsible for authentication operations, including login, JWT token generation and validation.
 */
export class AuthService {
  /**
   * Constructs the authentication service with necessary dependencies.
   * @param {PrismaService} prismaService Prisma service for database operations.
   * @param {JwtService} jwtService JWT service for token operations.
   */
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticates a user and generates JWT tokens.
   * @param {LoginDto} dto Login data transfer object containing email and password.
   * @param {boolean} [isOauthLogin=false] Indicates whether the login is through OAuth.
   * @return {Promise<TokensEntity>} The access and refresh tokens.
   */
  async login(dto: LoginDto, isOauthLogin = false): Promise<TokensEntity> {
    try {
      // find user by email
      const _user = await this.prismaService.user.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (!_user) {
        throw new UnauthorizedException('Invalid Email');
      }

      // if user is oauth login, skip password check
      if (
        !isOauthLogin &&
        !(await bcrypt.compare(dto.password, _user.password))
      ) {
        throw new UnauthorizedException('Invalid Password');
      }
      // Generate tokens and do not wait for user login times update
      const tokens = this.generateAndUpdateJwtTokens(_user.id);

      // Update user login times without waiting for it to finish
      this.updateUserLoginTimes(_user.id).catch((error) => {
        console.error('Error updating login times:', error);
      });

      return tokens;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Updates the user's login times and the daily statics login times.
   * @param {string} userId user id
   * @return {Promise<[User, DailyStatics]>} The updated user and daily statics entities.
   */
  updateUserLoginTimes(userId: string): Promise<[User, DailyStatics]> {
    const today = new Date().toISOString().split('T')[0];
    return Promise.all([
      this.prismaService.user.update({
        where: { id: userId },
        data: {
          loginTimes: {
            increment: 1,
          },
        },
      }),
      this.prismaService.dailyStatics.upsert({
        where: {
          date: today,
        },
        update: {
          loginTimes: {
            increment: 1,
          },
        },
        create: {
          date: today,
          loginTimes: 1,
        },
      }),
    ]);
  }

  /**
   * Generates a JWT token.
   * @param {string} userId User's unique identifier.
   * @param {string} username User's username.
   * @param {'access' | 'refresh'} tokenType Type of the token to generate ('access' or 'refresh').
   * @return {Promise<string>} The generated JWT token.
   */
  async generateJwtToken(
    userId: string,
    username: string,
    tokenType: 'access' | 'refresh',
  ): Promise<string> {
    // generate jwt token payload
    const payload = { username, sub: userId };

    // sign jwt token with different expiration times based on token type
    let token: string;
    if (tokenType === 'access') {
      token = this.jwtService.sign(payload);
    } else {
      token = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });
    }

    return token;
  }

  /**
   * Handles Google OAuth login or registration and generates JWT tokens.
   * @param {Object} req Request object containing the Google user entity.
   * @param {GoogleUserEntity} req.user The Google user entity.
   * @return {Promise<TokensEntity>} The access and refresh tokens.
   */
  async googleLogin(req: { user: GoogleUserEntity }): Promise<TokensEntity> {
    try {
      if (!req.user) {
        return {
          accessToken: null,
          refreshToken: null,
        };
      }

      const { id: oauthProviderId, email, username } = req.user;

      // find user by email
      const user = await this.prismaService.user.findUnique({
        where: { email },
        include: {
          providers: true,
        },
      });

      // if user not found, create a new user
      if (!user) {
        const newUser = await this.prismaService.user.create({
          data: {
            email,
            username,
            isVerified: true,
            providers: {
              create: {
                oauthProvider: 'google',
                oauthProviderId,
              },
            },
          },
        });

        return this.login({ email, password: newUser.password }, true);
      }

      // Check if Google provider exists
      const providerExists = user.providers.some(
        (provider) => provider.oauthProvider === 'google',
      );

      if (!providerExists) {
        await this.prismaService.provider.create({
          data: {
            oauthProvider: 'google',
            oauthProviderId,
            userId: user.id,
          },
        });

        // if user is not verified, update user to verified AND REMOVE PASSWORD
        if (!user.isVerified) {
          await this.prismaService.user.update({
            where: { id: user.id },
            data: {
              isVerified: true,
              password: null,
            },
          });
        }
      }

      return this.login({ email, password: user.password }, true);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Generates new JWT tokens and updates the user's refresh token in the database.
   * @param {string} userId The user's unique identifier.
   * @return {Promise<TokensEntity>} The new access and refresh tokens.
   */
  async generateAndUpdateJwtTokens(userId: string): Promise<TokensEntity> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });
      const { id, username } = user;
      const [accessToken, newRefreshToken] = await Promise.all([
        this.generateJwtToken(id, username, 'access'),
        this.generateJwtToken(id, username, 'refresh'),
      ]);

      await this.prismaService.user.update({
        where: { id },
        data: {
          refreshToken: newRefreshToken,
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Refreshes the JWT tokens based on the provided refresh token.
   * @param {string} refreshToken The refresh token.
   * @return {Promise<string>} The new access token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          refreshToken,
        },
      });
      if (!user) {
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return this.generateJwtToken(user.id, user.username, 'access');
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
