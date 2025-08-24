import { Controller, Post, Body, UseGuards, Get, Request, ValidationPipe, HttpCode, HttpStatus, UnauthorizedException, Header } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'private, max-age=300') // 5 minutes
  @Get('profile')
  async getProfile(@Request() req: FastifyRequest): Promise<UserResponseDto> {
    const user = await this.userService.findUserById(req.user!.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshToken(@Request() req: FastifyRequest): { access_token: string } {
    const access_token = this.authService.generateAccessToken(req.user!);

    return { access_token };
  }
}
