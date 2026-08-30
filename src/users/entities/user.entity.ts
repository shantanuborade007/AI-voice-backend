import { Column, Entity, OneToMany } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from '../../common/entities/abstract.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Business } from '../../businesses/entities/business.entity';

@Entity('users')
export class User extends AbstractEntity {
  @ApiProperty({ description: 'Unique email address used to sign in.', example: 'owner@business.com', format: 'email' })
  @Column({ unique: true })
  email: string;

  @ApiHideProperty()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ApiProperty({ description: 'Full name of the user.', example: 'Priya Sharma' })
  @Column({ name: 'full_name' })
  fullName: string;

  @ApiProperty({ description: 'Platform role.', enum: UserRole, example: UserRole.BUSINESS_OWNER, default: UserRole.BUSINESS_OWNER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.BUSINESS_OWNER })
  role: UserRole;

  @ApiProperty({ description: 'Whether the account can log in. Set to false to disable an account.', example: true, default: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiHideProperty()
  @OneToMany(() => Business, (business) => business.owner)
  businesses: Business[];
}
