import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { GoogleOAuthGuard } from './guards';
import { Response, Request as ExpressRequest } from 'express';
import { FRONTEND_URL } from '../../environment';
import { ApiOperation, ApiResponse, OmitType } from '@nestjs/swagger';
import { TokensEntity } from './entities/tokens.entity';

@Controller('auth')
/**
 * Controller for handling authentication requests.
 */
export class AuthController {
  /**
   * @param {AuthService} authService The authentication service.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Handles user login requests.
   * @param {LoginDto} dto The data transfer object containing login details.
   * @param {Response} response The express response object.
   * @return {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully.',
    type: TokensEntity,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid email or password.',
  })
  login(@Body() dto: LoginDto): Promise<TokensEntity> {
    return this.authService.login(dto);
  }

  /**
   * Handles refresh token requests to issue a new access token.
   * @param {ExpressRequest} req The express request object.
   * @param {Response} response The express response object.
   * @return {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access token refreshed successfully',
    type: OmitType(TokensEntity, ['refreshToken']),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshToken(@Req() req: ExpressRequest) {
    const _refreshToken = req.cookies['refreshToken'];
    return {
      accessToken: await this.authService.refreshToken(_refreshToken),
    };
  }

  /**
   * Initiates the Google OAuth login process.
   * @return {string} A greeting message.
   */
  @Get('google')
  @ApiOperation({ summary: 'Go to Google OAuth login' })
  @UseGuards(GoogleOAuthGuard)
  async googleLogin() {
    return 'hi';
  }

  /**
   * Handles the Google OAuth callback.
   * @param {Request} req The express request object, injected by NestJS.
   * @param {Response} response The express response object.
   * @return {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(HttpStatus.FOUND)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Google OAuth callback redirect',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async googleAuthRedirect(@Request() req, @Res() response: Response) {
    try {
      const { accessToken, refreshToken } =
        await this.authService.googleLogin(req);

      response.redirect(
        `${FRONTEND_URL}/login/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
      );
    } catch (e) {
      response.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
