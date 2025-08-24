import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserResponseDto } from './dto/auth-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findUserById(id: string): Promise<UserResponseDto | null> {
    const cacheKey = `user:${id}`;
    let userDto = await this.cacheManager.get<UserResponseDto>(cacheKey);
    if (!userDto) {
      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'fullname', 'email', 'username', 'phone', 'birthday', 'latestLogin', 'createdAt', 'updatedAt'],
      });
      if (user) {
        userDto = user;
        await this.cacheManager.set(cacheKey, userDto, 60 * 60 * 24);
      }
    }
    return userDto || null;
  }

  async invalidateUserCache(id: string): Promise<void> {
    await this.cacheManager.del(`user:${id}`);
  }
}
