import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { SharedModule } from '@/shared';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserStatics } from '../dto/user-statics.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { userStub } from './stubs/user.stub';
import { FRONTEND_URL } from '@/environment';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharedModule],
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    usersService.create = jest.fn().mockResolvedValue(userStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return a user', async () => {
      const createUserDto = plainToInstance(CreateUserDto, {
        username: userStub.username,
        email: userStub.email,
        password: userStub.password,
      });

      const errors = await validate(createUserDto);
      expect(errors).toHaveLength(0);
      expect(await controller.create(createUserDto)).toEqual(userStub);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('me', () => {
    it('should return the user data', async () => {
      const req = { user: { id: userStub.id } };
      usersService.findOne = jest.fn().mockResolvedValue(userStub);

      expect(await controller.me(req)).toEqual(userStub);
      expect(usersService.findOne).toHaveBeenCalledWith(userStub.id);
    });
  });

  describe('sendVerifyEmail', () => {
    it('should trigger sending a verify email', async () => {
      const req = { user: { id: userStub.id } };
      usersService.addVerifyEmailEvent = jest
        .fn()
        .mockResolvedValue({ message: 'Verification email sent' });

      expect(await controller.sendVerifyEmail(req)).toEqual({
        message: 'Verification email sent',
      });
      expect(usersService.addVerifyEmailEvent).toHaveBeenCalledWith(
        userStub.id,
      );
    });
  });

  describe('getUserStatics', () => {
    it('should return user statics', async () => {
      const statics: UserStatics = {
        usersCount: 1,
        todayLoginTimes: 1,
        last7DaysAvgLoginTimes: 1,
      };
      usersService.getUserStatics = jest.fn().mockResolvedValue(statics);

      expect(await controller.getUserStatics()).toEqual(statics);
      expect(usersService.getUserStatics).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    const token = 'valid-token';
    let res;

    beforeEach(() => {
      res = {
        redirect: jest.fn(),
      };
      usersService.verifyEmail = jest.fn().mockResolvedValue(undefined); // a successful verification
    });

    it('should redirect to the frontend URL on successful verification', async () => {
      await controller.verifyEmail(token, res);
      expect(usersService.verifyEmail).toHaveBeenCalledWith(token);
      expect(res.redirect).toHaveBeenCalledWith(FRONTEND_URL);
    });

    it('should handle errors when verification fails', async () => {
      const errorMessage = 'Verification failed';
      usersService.verifyEmail = jest
        .fn()
        .mockRejectedValue(
          new HttpException(errorMessage, HttpStatus.BAD_REQUEST),
        );

      const error = await controller.verifyEmail(token, res);
      expect(error).toEqual(
        new HttpException(errorMessage, HttpStatus.BAD_REQUEST),
      );
      expect(error.message).toEqual(errorMessage);
      expect(usersService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('resetPassword', () => {
    it('should reset the password successfully', async () => {
      const req = { user: { id: userStub.id } };
      const dto: ResetPasswordDto = {
        id: userStub.id,
        oldPassword: 'oldPassword',
        newPassword: 'newPassword',
      };
      usersService.resetPassword = jest.fn().mockResolvedValue(undefined);

      await expect(controller.resetPassword(req, dto)).resolves.not.toThrow();
      expect(usersService.resetPassword).toHaveBeenCalledWith({
        ...dto,
        id: req.user.id,
      });
    });
  });
});
