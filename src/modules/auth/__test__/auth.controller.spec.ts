import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { FRONTEND_URL } from '../../../environment';
import { HttpStatus } from '@nestjs/common';

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

      await controller.login(dto);

      const response = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(response).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('should clear the refreshToken cookie', async () => {
      const response = {
        sendStatus: jest.fn(),
      };
      await controller.logout(response as any);
      expect(response.sendStatus).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and set new cookies', async () => {
      const accessToken = 'access-token';
      authService.refreshToken = jest.fn().mockResolvedValue(accessToken);

      const req = { cookies: { refreshToken: 'refresh-token' } };

      const res = await controller.refreshToken(req as any);

      expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');

      expect(res).toEqual({
        accessToken,
      });
    });
  });

  describe('googleAuthRedirect', () => {
    it('should perform OAuth login and redirect with cookies set', async () => {
      const req = {
        user: {},
      };
      const res = { redirect: jest.fn() };
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      authService.googleLogin = jest.fn().mockResolvedValue(tokens);
      await controller.googleAuthRedirect(req as any, res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        `${FRONTEND_URL}/login/google/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      );
    });
  });
});
