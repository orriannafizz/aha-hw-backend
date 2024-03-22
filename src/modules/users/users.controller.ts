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
import { FRONTEND_URL } from '../../environment';
import { Response } from 'express';
import { UserStatics } from './dto/user-statics.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../auth/guards';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../../constants';

@Controller('users')
@ApiTags('users')
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    type: UserPartialEntity,
  })
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
  @ApiOperation({ summary: 'Get user data' })
  @ApiCreatedResponse({
    description: 'The user data has been successfully retrieved.',
    type: UserPartialEntity,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiBearerAuth(SWAGGER_BEARER_AUTH.USER)
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
  @ApiOperation({ summary: 'Send verification email to the user' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Verification email sent',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiBearerAuth(SWAGGER_BEARER_AUTH.USER)
  async sendVerifyEmail(@Request() req) {
    return this.usersService.addVerifyEmailEvent(req.user.id);
  }

  /**
   * gets the user's daily statistics.
   * @return {Promise<UserStatics>} user login statistics.
   */
  @Get('statics')
  @ApiOperation({ summary: 'Get user statics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user statics has been successfully retrieved.',
    type: UserStatics,
  })
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
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully, redirecting...',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid token' })
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
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reset the user password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad Request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiBearerAuth(SWAGGER_BEARER_AUTH.USER)
  async resetPassword(@Request() req, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword({
      ...dto,
      id: req.user.id,
    });
  }
}
