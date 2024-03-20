import {
  ApiHideProperty,
  ApiProperty,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { User } from '@prisma/client';

/**
 * User entity to implement the User interface from Prisma.
 */
export class UserEntity implements User {
  @ApiProperty({
    example: 'efb5c2ab-ecdb-45a3-9c8b-e96b92e13251',
    description: 'The uuid of the user',
  })
  id: string;

  @ApiProperty({
    example: 'brian',
    description: 'The username of the user',
  })
  username: string;

  @ApiProperty({
    example: 'orriannafizz@gmail.com',
    description: 'The email of the user',
  })
  email: string;

  @ApiHideProperty()
  password: string;

  @ApiProperty({
    example: 0,
    description: 'The login times of the user',
  })
  loginTimes: number;

  @ApiHideProperty()
  emailVerifyToken: string;

  @ApiHideProperty()
  refreshToken: string;

  @ApiProperty({
    example: true,
    description: 'The isVerified email of the user',
  })
  isVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Partial type of the UserEntity to be used in responses.
 */
export class UserPartialEntity extends PartialType(
  OmitType(UserEntity, ['password', 'emailVerifyToken']),
) {
  hasPassword?: boolean;
}
