import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`User ${id} not found`);
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(params: {
    email: string;
    passwordHash: string;
    fullName: string;
    role?: UserRole;
  }): Promise<User> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      this.logger.warn(`Create user rejected: ${params.email} already exists`);
      throw new ConflictException('An account with this email already exists');
    }

    const user = this.usersRepository.create({
      email: params.email,
      passwordHash: params.passwordHash,
      fullName: params.fullName,
      role: params.role ?? UserRole.BUSINESS_OWNER,
    });

    const saved = await this.usersRepository.save(user);
    this.logger.log(`Created user ${saved.id} (${saved.email}, role=${saved.role})`);
    return saved;
  }
}
