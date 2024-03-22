import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsStrongPassword } from 'class-validator';

/**
 * Reset password DTO
 */
export class ResetPasswordDto {
  @IsString()
  @IsOptional()
  @ApiHideProperty()
  id: string;

  @IsStrongPassword({ minLength: 8 })
  @IsOptional()
  @ApiProperty({
    example: 'oldPassword123!',
    description: 'The old password of the user',
  })
  oldPassword: string;

  @ApiProperty({
    example: 'newPassword123!',
    description: 'The new password of the user',
  })
  @IsStrongPassword({ minLength: 8 })
  newPassword: string;
}
