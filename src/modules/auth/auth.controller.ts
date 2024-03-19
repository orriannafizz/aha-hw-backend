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
import { FRONTEND_URL, NODE_ENV } from '../../environment';

/**
 * Controller for handling authentication requests.
 */
@Controller('auth')
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
  async login(@Body() dto: LoginDto, @Res() response: Response) {
    const data = await this.authService.login(dto);
    const { accessToken, refreshToken } = data;

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.send({
      accessToken: accessToken,
    });
  }

  /**
   * Handles user logout requests.
   * @param {Response} response The express response object.
   * @return {void}
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res() response: Response) {
    response.cookie('refreshToken', '', {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

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
  async refreshToken(@Req() req: ExpressRequest, @Res() response: Response) {
    const _refreshToken = req.cookies['refreshToken'];
    const tokens = await this.authService.refreshToken(_refreshToken);

    const { accessToken, refreshToken } = tokens;
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.send({
      accessToken: accessToken,
    });
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
   * @param {Response} res The express response object.
   * @return {Promise<void>} A promise that resolves when the operation is complete.
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(HttpStatus.OK)
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const loginResult = await this.authService.googleLogin(req);
    const { accessToken, refreshToken } = loginResult;

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(FRONTEND_URL);
  }
}
