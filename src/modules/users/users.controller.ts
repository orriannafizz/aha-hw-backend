import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post('send-verify-email')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendVerifyEmail() {
    return this.usersService.addVerifyEmailEvent();
  }
}
