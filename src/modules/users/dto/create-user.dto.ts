import { IsEmail, IsString, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * The create user DTO.
 */
export class CreateUserDto {
  @IsString()
  @ApiProperty({
    example: 'brian',
    description: 'The username of the user',
  })
  username: string;

  @IsEmail()
  @ApiProperty({
    example: 'orriannafizz@gmail.com',
    description: 'The email of the user',
  })
  email: string;

  @IsStrongPassword({ minLength: 8 })
  @ApiProperty({
    example: 'passworD123!',
    description: 'The password of the user',
  })
  password: string;
}
