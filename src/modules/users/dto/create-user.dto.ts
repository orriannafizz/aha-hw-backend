import { IsEmail, IsString, MinLength } from 'class-validator';
import {
  ContainsDigit,
  ContainsLowercaseLetter,
  ContainsSpecialCharacter,
  ContainsUppercaseLetter,
} from 'src/common/decorators/password.decorator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @ContainsLowercaseLetter()
  @ContainsUppercaseLetter()
  @ContainsDigit()
  @ContainsSpecialCharacter()
  @MinLength(8)
  password: string;
}
