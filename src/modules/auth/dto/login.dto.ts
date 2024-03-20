import { ApiProperty } from '@nestjs/swagger';

/**
 * The login DTO.
 */
export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  email: string;

  @ApiProperty({ example: 'password', description: 'The password of the user' })
  password: string;
}
