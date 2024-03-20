import { PrismaService } from '@/shared/prisma/prisma.service';

describe('PrismaService', () => {
  let prismaService: PrismaService;
  let connectSpy: jest.SpyInstance;
  let disconnectSpy: jest.SpyInstance;

  beforeEach(() => {
    prismaService = new PrismaService();
    connectSpy = jest
      .spyOn(prismaService, '$connect')
      .mockImplementation(async () => {});
    disconnectSpy = jest
      .spyOn(prismaService, '$disconnect')
      .mockImplementation(async () => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect when module initializes', async () => {
    await prismaService.onModuleInit();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should handle connection error', async () => {
    connectSpy.mockImplementationOnce(async () => {
      throw new Error('Connection failed');
    });
    await expect(prismaService.onModuleInit()).rejects.toThrow(
      'Connection failed',
    );
  });

  it('should disconnect when module is destroyed', async () => {
    await prismaService.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});
