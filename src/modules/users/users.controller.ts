import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UserPartialEntity } from './entities/user.entity';

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
   * @return {Promise<{message:string}>}
   */
  @Post('send-verify-email')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendVerifyEmail() {
    return this.usersService.addVerifyEmailEvent();
  }
}
