import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let connectMock: jest.SpiedFunction<PrismaService['$connect']>;
  let disconnectMock: jest.SpiedFunction<PrismaService['$disconnect']>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    connectMock = jest.spyOn(service, '$connect').mockResolvedValue(undefined);
    disconnectMock = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('connects on module init', async () => {
    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('disconnects on module destroy', async () => {
    await service.onModuleDestroy();

    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
