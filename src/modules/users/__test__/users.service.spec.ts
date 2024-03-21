import { Test, TestingModule } from '@nestjs/testing';
import { userPartialStub, userStub } from './stubs/user.stub';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { UsersService } from '../users.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { EMAIL_QUEUE } from '@/constants';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation((inputPassword) => {
    return Promise.resolve(inputPassword !== 'newValidPassword'); // for resetPassword
  }),
  hash: jest.fn().mockResolvedValue('hashedNewPassword'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: EMAIL_QUEUE.QUEUE,
        }),
      ],
      providers: [
        UsersService,
        PrismaService,
        {
          provide: getQueueToken(EMAIL_QUEUE.QUEUE),
          useValue: {
            add: jest.fn().mockResolvedValueOnce({}),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    // mock
    prismaService.user.findUnique = jest
      .fn()
      .mockResolvedValue(userPartialStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
    prismaService.$disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      prismaService.user.findUnique = jest
        .fn()
        .mockResolvedValue(userPartialStub);
      expect(await service.findOne(userPartialStub.id)).toEqual(
        userPartialStub,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should throw an exception if email already exists', async () => {
      prismaService.user.count = jest.fn().mockResolvedValueOnce(1);
      const dto: CreateUserDto = {
        username: userStub.username,
        email: userStub.email,
        password: userStub.password,
      };
      await expect(service.create(dto)).rejects.toThrow(
        new HttpException('Email already exists', HttpStatus.CONFLICT),
      );
    });

    it('should create a new user', async () => {
      prismaService.user.count = jest.fn().mockResolvedValue(0);
      prismaService.user.create = jest.fn().mockResolvedValue(userStub);

      const dto: CreateUserDto = {
        username: userStub.username,
        email: userStub.email,
        password: userStub.password,
      };

      expect(await service.create(dto)).toEqual(userPartialStub);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: userStub.username,
          email: userStub.email,
          password: expect.any(String),
        },
      });
    });
  });

  describe('addVerifyEmailEvent', () => {
    it('should add a verify email event to the queue for an unverified user', async () => {
      prismaService.user.findUniqueOrThrow = jest
        .fn()
        .mockResolvedValue(userStub);

      const result = await service.addVerifyEmailEvent('1');
      expect(result).toEqual({ message: 'Email sent' });
    });

    it('should throw an error if the user email is already verified', async () => {
      const verifiedUser = { ...userStub, isVerified: true };
      prismaService.user.findUniqueOrThrow = jest
        .fn()
        .mockResolvedValue(verifiedUser);

      await expect(service.addVerifyEmailEvent('1')).rejects.toThrow(
        new HttpException('Email already verified', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('getUserStatics', () => {
    it('should return user statistics', async () => {
      const usersCount = 10;
      const todayLoginTimes = 5;
      const last7DaysAvgLoginTimes = 9;

      prismaService.user.count = jest.fn().mockResolvedValue(usersCount);
      prismaService.dailyStatics.findFirst = jest
        .fn()
        .mockResolvedValue({ loginTimes: todayLoginTimes });
      prismaService.dailyStatics.aggregate = jest
        .fn()
        .mockResolvedValue({ _avg: { loginTimes: last7DaysAvgLoginTimes } });

      const result = await service.getUserStatics();
      expect(result).toEqual({
        usersCount,
        todayLoginTimes,
        last7DaysAvgLoginTimes,
      });
    });
  });
  describe('verifyEmail', () => {
    it('should verify email successfully with valid token', async () => {
      prismaService.user.update = jest.fn().mockResolvedValue({
        ...userStub,
        isVerified: true,
        emailVerifyToken: null,
      });

      const result = await service.verifyEmail('valid-token');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          emailVerifyToken: 'valid-token',
        },
        data: {
          isVerified: true,
          emailVerifyToken: null,
        },
      });
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should throw an error if the token is invalid', async () => {
      prismaService.user.update = jest.fn().mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        new HttpException('Invalid token', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw an error if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      await expect(
        service.resetPassword({
          id: 'non-existing-id',
          oldPassword: 'oldPassword',
          newPassword: 'newPassword',
        }),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should successfully reset password for valid request', async () => {
      const user = {
        id: 'user-id',
        password: 'existingHashedPassword',
      };

      // mock the methods
      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      prismaService.user.update = jest.fn().mockResolvedValue({
        ...user,
        password: 'newHashedPassword',
      });

      // call the method
      const result = await service.resetPassword({
        id: 'user-id',
        oldPassword: 'validOldPassword',
        newPassword: 'newValidPassword',
      });

      // check if the old password is compared
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { password: expect.any(String) },
      });

      expect(result).toBeDefined();
    });
  });
});
