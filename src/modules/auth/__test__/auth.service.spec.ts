import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { TokensEntity } from '../entities/tokens.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation((inputPassword) => {
    return Promise.resolve(inputPassword !== 'wrongPassword');
  }),
  hash: jest.fn().mockResolvedValue('hashedNewPassword'),
}));
describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            provider: {
              create: jest.fn(),
            },
            dailyStatics: {
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('login', () => {
    it('should throw an error if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid Email',
      );
    });

    it('should return tokens for valid login', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'testUser',
      };
      const tokens: TokensEntity = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      jwtService.sign = jest.fn().mockResolvedValue('access-token');
      prismaService.user.update = jest.fn().mockResolvedValue(user);

      authService.generateAndUpdateJwtTokens = jest
        .fn()
        .mockResolvedValue(tokens);

      const result = await authService.login({
        email: user.email,
        password: 'validPassword',
      });
      expect(result).toEqual(tokens);
    });
  });

  describe('updateUserLoginTimes', () => {
    it('should update the user login times and daily statics successfully', async () => {
      const userId = '1';
      const today = new Date().toISOString().split('T')[0];
      const updatedUser = { id: userId, loginTimes: 5 };
      const updatedDailyStatics = { date: today, loginTimes: 100 };

      // Mock the prisma service to simulate updating login times
      prismaService.user.update = jest.fn().mockResolvedValue(updatedUser);
      prismaService.dailyStatics.upsert = jest
        .fn()
        .mockResolvedValue(updatedDailyStatics);

      // Call the updateUserLoginTimes method
      const result = await authService.updateUserLoginTimes(userId);

      // Verify the result and that the prisma service methods were called correctly
      expect(result).toEqual([updatedUser, updatedDailyStatics]);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { loginTimes: { increment: 1 } },
      });
      expect(prismaService.dailyStatics.upsert).toHaveBeenCalledWith({
        where: { date: today },
        update: { loginTimes: { increment: 1 } },
        create: { date: today, loginTimes: 1 },
      });
    });
  });

  describe('generateJwtToken', () => {
    it('should generate an access token with correct payload and options', async () => {
      const userId = '1';
      const username = 'testUser';
      const tokenType = 'access';

      // Setup mock implementation
      const expectedToken = 'token';
      JwtService;
      jwtService.sign = jest.fn().mockReturnValue(expectedToken);

      const result = await authService.generateJwtToken(
        userId,
        username,
        tokenType,
      );

      expect(jwtService.sign).toHaveBeenCalledWith({ username, sub: userId });
      expect(result).toEqual(expectedToken);
    });

    it('should generate a refresh token with correct payload and options', async () => {
      const userId = '1';
      const username = 'testUser';
      const tokenType = 'refresh';

      // Setup mock implementation
      const expectedToken = 'refreshToken';
      jwtService.sign = jest.fn().mockReturnValue(expectedToken);

      const result = await authService.generateJwtToken(
        userId,
        username,
        tokenType,
      );

      expect(jwtService.sign).toHaveBeenCalledWith(
        { username, sub: userId },
        { expiresIn: '7d' },
      );
      expect(result).toEqual(expectedToken);
    });
  });

  describe('googleLogin', () => {
    it('should create a new user if not exists and return tokens', async () => {
      const req = {
        user: {
          id: 'googleId',
          email: 'new@example.com',
          username: 'newUser',
          picture: 'picture',
          accessToken: 'access-token',
        },
      };
      const tokens: TokensEntity = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.user.create = jest.fn().mockResolvedValue({
        id: '1',
        email: req.user.email,
        username: req.user.username,
        password: null,
      });
      authService.login = jest.fn().mockResolvedValue(tokens);

      const result = await authService.googleLogin(req);
      expect(result).toEqual(tokens);
      expect(authService.login).toHaveBeenCalledWith(
        { email: req.user.email, password: null },
        true,
      );
    });
  });

  describe('generateAndUpdateJwtTokens', () => {
    it('should generate access and refresh tokens and update user refresh token', async () => {
      const userId = '1';
      const user = { id: userId, username: 'testUser' };

      // Setup mocks
      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      prismaService.user.update = jest.fn().mockResolvedValue(true);
      authService.generateJwtToken = jest
        .fn()
        .mockResolvedValueOnce('accessToken')
        .mockResolvedValueOnce('refreshToken');

      const result = await authService.generateAndUpdateJwtTokens(userId);

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      expect(authService.generateJwtToken).toHaveBeenCalledTimes(2);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: 'refreshToken' },
      });
    });
  });
  describe('refreshToken', () => {
    it('should throw an error if refresh token is invalid', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.refreshToken('invalidToken')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should return new tokens for valid refresh token', async () => {
      const user = { id: '1', refreshToken: 'validToken' };
      const newTokens: TokensEntity = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      authService.generateAndUpdateJwtTokens = jest
        .fn()
        .mockResolvedValue(newTokens);

      const result = await authService.refreshToken(user.refreshToken);
      expect(result).toEqual(newTokens);
    });
  });
});
