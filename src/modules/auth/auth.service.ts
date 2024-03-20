import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { GoogleUserEntity } from './entities/google-user.entity';
import * as bcrypt from 'bcrypt';
import { TokensEntity } from './entities/tokens.entity';
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
        throw new HttpException('Invalid Email', HttpStatus.UNAUTHORIZED);
      }
      // if user is oauth login, skip password check
      if (!isOauthLogin) {
        // compare password
        try {
          const isPasswordValid = await bcrypt.compare(
            dto.password,
            _user.password,
          );

          if (!isPasswordValid) {
            throw new HttpException(
              'Invalid Password',
              HttpStatus.UNAUTHORIZED,
            );
          }
        } catch (error) {
          throw new HttpException('Invalid Password', HttpStatus.UNAUTHORIZED);
        }
      }

      const tokens = await this.generateAndUpdateJwtTokens(_user.id);

      // generate jwt token
      return tokens;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
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
      token = this.jwtService.sign(payload, {
        expiresIn: '10s',
      });
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
   * @return {Promise<TokensEntity>} The new access and refresh tokens.
   */
  async refreshToken(refreshToken: string): Promise<TokensEntity> {
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
      return this.generateAndUpdateJwtTokens(user.id);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
