import { IsOptional, IsString, IsStrongPassword } from 'class-validator';

/**
 * Reset password DTO
 */
export class ResetPasswordDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsStrongPassword()
  oldPassword: string;

  @IsStrongPassword()
  newPassword: string;
}
