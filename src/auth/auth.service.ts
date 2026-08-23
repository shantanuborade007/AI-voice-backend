import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/enums/user-role.enum';

interface AuthSubject {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    this.logger.log(`Register attempt for ${dto.email}`);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: UserRole.BUSINESS_OWNER,
    });
    this.logger.log(`Registered new user ${user.id} (${user.email})`);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for ${dto.email}`);
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`Login failed for ${dto.email}: no account with this email`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed for ${dto.email} (user ${user.id}): bad password`);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      this.logger.warn(`Login failed for ${dto.email} (user ${user.id}): account inactive`);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`Login succeeded for ${user.email} (user ${user.id})`);
    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: AuthSubject) {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
