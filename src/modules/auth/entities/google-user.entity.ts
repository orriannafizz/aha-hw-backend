import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * Google user entity to implement the user from google.
 */
export class GoogleUserEntity {
  @IsString()
  @ApiProperty({
    example: 'efb5c2ab-ecdb-45a3-9c8b-e96b92e13251',
    description: 'The id of the user from google',
  })
  id: string;

  @IsString()
  @ApiProperty({
    example: 'brian',
    description: 'The username of the user from google',
  })
  username: string;

  @IsEmail()
  @ApiProperty({
    example: 'orriannafizz@gmail.com',
    description: 'The email of the user from google',
  })
  email: string;

  @IsString()
  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a-/AOh14Gg5vX4c1Jz',
    description: 'The picture of the user from google',
  })
  picture: string;

  @IsString()
  @ApiProperty({
    example: '1234567890',
    description: 'The oauth provider id of the user from google',
  })
  accessToken: string;
}
