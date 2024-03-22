import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';

/**
 * The login DTO.
 */
export class LoginDto {
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  email: string;

  @IsStrongPassword()
  @ApiProperty({
    example: 'Password!123',
    description: 'The password of the user',
  })
  password: string;
}
