/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

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

  const mockRegisterDto: RegisterDto = {
    fullname: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    username: 'johndoe',
    password: 'password123',
    birthday: '1990-01-01',
  };

  const mockLoginDto: LoginDto = {
    account: 'johndoe',
    password: 'password123',
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null); // No existing user
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await service.register(mockRegisterDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledTimes(3); // Check username, email, phone
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        fullname: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'hashedPassword123',
        birthday: new Date('1990-01-01'),
        latestLogin: expect.any(Date),
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        fullname: mockUser.fullname,
        username: mockUser.username,
        email: mockUser.email,
        phone: mockUser.phone,
      });
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          fullname: mockUser.fullname,
          email: mockUser.email,
          username: mockUser.username,
          phone: mockUser.phone,
          birthday: mockUser.birthday,
          latestLogin: mockUser.latestLogin,
        },
      });
    });

    it('should throw ConflictException if username already exists', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValueOnce(mockUser); // Username exists

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(new ConflictException('Username already exists'));
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'johndoe' },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      userRepository.findOne
        .mockResolvedValueOnce(null) // Username doesn't exist
        .mockResolvedValueOnce(mockUser); // Email exists

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(new ConflictException('Email already exists'));
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('should throw ConflictException if phone already exists', async () => {
      // Arrange
      userRepository.findOne
        .mockResolvedValueOnce(null) // Username doesn't exist
        .mockResolvedValueOnce(null) // Email doesn't exist
        .mockResolvedValueOnce(mockUser); // Phone exists

      // Act & Assert
      await expect(service.register(mockRegisterDto)).rejects.toThrow(new ConflictException('Phone number already exists'));
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { phone: '+1234567890' },
      });
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({} as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await service.login(mockLoginDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: 'johndoe' }, { username: 'johndoe' }, { phone: 'johndoe' }],
        select: ['id', 'fullname', 'email', 'username', 'phone', 'password'],
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        latestLogin: expect.any(Date),
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        fullname: mockUser.fullname,
        username: mockUser.username,
        email: mockUser.email,
        phone: mockUser.phone,
      });
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          fullname: mockUser.fullname,
          email: mockUser.email,
          username: mockUser.username,
          phone: mockUser.phone,
          birthday: mockUser.birthday,
          latestLogin: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(mockLoginDto)).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.validateUser('johndoe', 'password123');

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: 'johndoe' }, { username: 'johndoe' }, { phone: 'johndoe' }],
        select: ['id', 'fullname', 'email', 'username', 'phone', 'password'],
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('nonexistent', 'password123');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for wrong password', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await service.validateUser('johndoe', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate access token', () => {
      // Arrange
      const payload = {
        sub: mockUser.id,
        fullname: mockUser.fullname,
        username: mockUser.username,
        email: mockUser.email,
        phone: mockUser.phone,
      };
      jwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = service.generateAccessToken(payload);

      // Assert
      expect(result).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
    });
  });
});
