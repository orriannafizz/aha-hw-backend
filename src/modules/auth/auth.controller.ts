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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Handles user logout requests.
   * @param {Response} response The express response object.
   * @return {void}
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() response: Response) {
    // response.cookie('accessToken', '', {
    //   sameSite: 'none',
    //   path: '/',
    //   maxAge: 0,
    // });

    // response.cookie('refreshToken', '', {
    //   sameSite: 'none',
    //   httpOnly: true,
    //   path: '/',
    //   maxAge: 0,
    // });

    response.sendStatus(HttpStatus.OK);
  }

  /**
   * Handles refresh token requests to issue a new access token.
   * @param {ExpressRequest} req The express request object.
   * @param {Response} response The express response object.
   * @return {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  async googleAuthRedirect(@Request() req, @Res() response: Response) {
    const { accessToken, refreshToken } =
      await this.authService.googleLogin(req);

    response.redirect(
      `${FRONTEND_URL}/login/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  }
}
