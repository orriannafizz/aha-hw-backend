import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { HttpStatus } from '@nestjs/common';
import { FRONTEND_URL } from '@/environment';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshToken: jest.fn(),
            googleLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('login', () => {
    it('should call authService.login and set cookie', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password' };
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authService.login = jest.fn().mockResolvedValue(tokens);

      const response = {
        cookie: jest.fn(),
        send: jest.fn(),
      };

      await controller.login(dto, response as any);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokens.refreshToken,
        expect.any(Object),
      );
      expect(response.send).toHaveBeenCalledWith({
        accessToken: tokens.accessToken,
      });
    });
  });

  describe('logout', () => {
    it('should clear the refreshToken cookie', async () => {
      const response = {
        cookie: jest.fn(),
        sendStatus: jest.fn(),
      };

      controller.logout(response as any);

      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        '',
        expect.any(Object),
      );
      expect(response.sendStatus).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and set new cookies', async () => {
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      authService.refreshToken = jest.fn().mockResolvedValue(tokens);

      const req = { cookies: { refreshToken: 'old-refresh-token' } };
      const response = {
        cookie: jest.fn(),
        send: jest.fn(),
      };

      await controller.refreshToken(req as any, response as any);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokens.refreshToken,
        expect.any(Object),
      );
      expect(response.send).toHaveBeenCalledWith({
        accessToken: tokens.accessToken,
      });
    });
  });

  describe('googleAuthRedirect', () => {
    it('should perform OAuth login and redirect with cookies set', async () => {
      const req = {
        user: {},
      };
      const res = { cookie: jest.fn(), redirect: jest.fn() };
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      authService.googleLogin = jest.fn().mockResolvedValue(tokens);

      await controller.googleAuthRedirect(req as any, res as any);

      expect(authService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.cookie).toHaveBeenCalledTimes(2); // set accessToken and refreshToken
      expect(res.redirect).toHaveBeenCalledWith(FRONTEND_URL);
    });
  });
});
