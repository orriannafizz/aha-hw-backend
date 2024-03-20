import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
}
