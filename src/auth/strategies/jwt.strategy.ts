import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: AuthUser): Promise<AuthUser> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'fullname', 'email', 'username', 'phone'],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      phone: user.phone,
    };
  }
}
