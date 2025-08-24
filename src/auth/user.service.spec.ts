/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from './user.service';
import { User } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: any;
  let cacheManager: any;

  const mockUser: User = {
    id: '1',
    fullname: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    username: 'johndoe',
    password: 'hashedPassword123',
    birthday: new Date('1990-01-01'),
    latestLogin: new Date('2024-01-01'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
    };

    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    cacheManager = module.get(CACHE_MANAGER);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserById', () => {
    it('should return user from cache when available', async () => {
      // Arrange
      const cachedUser = {
        id: mockUser.id,
        fullname: mockUser.fullname,
        email: mockUser.email,
        username: mockUser.username,
        phone: mockUser.phone,
        birthday: mockUser.birthday,
        latestLogin: mockUser.latestLogin,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };
      cacheManager.get.mockResolvedValue(cachedUser);

      // Act
      const result = await service.findUserById(mockUser.id);

      // Assert
      expect(result).toEqual(cachedUser);
      expect(cacheManager.get).toHaveBeenCalledWith(`user:${mockUser.id}`);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return user from database and cache it when not in cache', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findUserById(mockUser.id);

      // Assert
      expect(result).toEqual(mockUser);
      expect(cacheManager.get).toHaveBeenCalledWith(`user:${mockUser.id}`);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: ['id', 'fullname', 'email', 'username', 'phone', 'birthday', 'latestLogin', 'createdAt', 'updatedAt'],
      });
      expect(cacheManager.set).toHaveBeenCalledWith(`user:${mockUser.id}`, mockUser, 60 * 60 * 24);
    });

    it('should return null when user not found in database', async () => {
      // Arrange
      cacheManager.get.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findUserById('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('invalidateUserCache', () => {
    it('should delete user from cache', async () => {
      // Arrange
      const userId = 'test-user-id';

      // Act
      await service.invalidateUserCache(userId);

      // Assert
      expect(cacheManager.del).toHaveBeenCalledWith(`user:${userId}`);
    });
  });
});
