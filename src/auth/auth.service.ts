import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { fullname, phone, email, username, password, birthday } = registerDto;

    if (username) {
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    if (email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (phone) {
      const existingUser = await this.userRepository.findOne({
        where: { phone },
      });

      if (existingUser) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = this.userRepository.create({
      fullname,
      phone,
      email,
      username,
      password: hashedPassword,
      birthday: new Date(birthday),
      latestLogin: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    const access_token = this.generateAccessToken({
      sub: savedUser.id,
      fullname: savedUser.fullname,
      username: savedUser.username,
      email: savedUser.email,
      phone: savedUser.phone,
    });

    return {
      access_token,
      user: {
        id: savedUser.id,
        fullname: savedUser.fullname,
        email: savedUser.email,
        username: savedUser.username,
        phone: savedUser.phone,
        birthday: savedUser.birthday,
        latestLogin: savedUser.latestLogin,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.account, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = new Date();
    await this.userRepository.update(user.id, { latestLogin: now });

    const access_token = this.generateAccessToken({
      sub: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      phone: user.phone,
    });

    return {
      access_token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        phone: user.phone,
        birthday: user.birthday,
        latestLogin: now,
      },
    };
  }

  async validateUser(account: string, password: string): Promise<User | null> {
    // Find user by email, username, or phone
    const user = await this.userRepository.findOne({
      where: [{ email: account }, { username: account }, { phone: account }],
      select: ['id', 'fullname', 'email', 'username', 'phone', 'password'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  generateAccessToken(payload: AuthUser): string {
    return this.jwtService.sign(payload);
  }
}
