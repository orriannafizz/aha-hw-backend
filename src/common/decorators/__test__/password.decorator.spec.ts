import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { validate } from 'class-validator';

describe('CustomValidators', () => {
  let createUserDto: CreateUserDto;

  beforeEach(() => {
    createUserDto = new CreateUserDto();
    createUserDto.username = 'username';
    createUserDto.email = 'good@email.hi';
  });

  it('should fail if password does not contain a lowercase letter', async () => {
    createUserDto.password = 'ABC123!@#';
    const errors = await validate(createUserDto);
    console.log(errors);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('containsLowercaseLetter');
  });

  it('should fail if password does not contain an uppercase letter', async () => {
    createUserDto.password = 'abc123!@#';
    const errors = await validate(createUserDto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('containsUppercaseLetter');
  });

  it('should fail if password does not contain a digit', async () => {
    createUserDto.password = 'Abcdef!@#';
    const errors = await validate(createUserDto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('containsDigit');
  });

  it('should fail if password does not contain a special character', async () => {
    createUserDto.password = 'Abcdef123';
    const errors = await validate(createUserDto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('containsSpecialCharacter');
  });

  it('should pass if password meets all criteria', async () => {
    createUserDto.password = 'Abc123!@#';
    const errors = await validate(createUserDto);
    expect(errors).toHaveLength(0);
  });
});
