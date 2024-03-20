import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UserPartialEntity } from './entities/user.entity';
import { FRONTEND_URL } from 'src/environment';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards';
import { UserStatics } from './dto/user-statics.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
/**
 * Controller for handling user-related requests.
 */
export class UsersController {
  /**
   * @param {UsersService} usersService The users service for handling user-related operations.
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user with the provided details.
   *
   * @param {CreateUserDto} dto The user details. Extracted from the request body.
   * @return {UserPartialEntity} The created user.
   */
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserPartialEntity> {
    return this.usersService.create(dto);
  }

  /**
   * @param {Request} req the request object.
   * @return {Promise<UserPartialEntity>} The user details.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Request() req): Promise<UserPartialEntity> {
    return this.usersService.findOne(req.user.id);
  }

  /**
   * Sends a verification email to the user's email address.
   * @param {Request} req The request object.
   * @return {Promise<{message:string}>}
   */
  @Post('send-verify-email')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  async sendVerifyEmail(@Request() req) {
    return this.usersService.addVerifyEmailEvent(req.user.id);
  }

  /**
   * gets the user's daily statistics.
   * @return {Promise<UserStatics>} user login statistics.
   */
  @Get('statics')
  @HttpCode(HttpStatus.OK)
  async getUserStatics(): Promise<UserStatics> {
    return this.usersService.getUserStatics();
  }

  /**
   * Verifies the user's email address.
   * @param {string} token The verification token.
   * @param {Response} res The response object.
   * @return {Promise<void>} The result of the verification.
   */
  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Param('token') token: string, @Res() res: Response) {
    try {
      await this.usersService.verifyEmail(token);
      res.redirect(FRONTEND_URL);
    } catch (err) {
      return err;
    }
  }

  /**
   *
   * @param {Request} req The request object.
   * @param {ResetPasswordDto} dto The reset password details.
   * @return {Promise<void>} The result of the password reset.
   */
  @Patch('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Request() req, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword({
      ...dto,
      id: req.user.id,
    });
  }
}
