import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

class AuthUserDto {
  @ApiProperty({ description: 'User ID (UUID).', example: 'b3f1c9a0-6e1a-4b3a-8c7e-2f9a1d4e5c6b', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Email address.', example: 'owner@business.com', format: 'email' })
  email: string;

  @ApiProperty({ description: 'Full name.', example: 'Priya Sharma' })
  fullName: string;

  @ApiProperty({ description: 'Platform role.', enum: UserRole, example: UserRole.BUSINESS_OWNER })
  role: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token. Pass it as `Authorization: Bearer <token>` on subsequent requests.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ description: 'The authenticated user.', type: AuthUserDto })
  user: AuthUserDto;
}
