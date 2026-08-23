import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Email address used to sign in. Must be unique across all users.', example: 'owner@business.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Account password, minimum 8 characters. Stored as a bcrypt hash.', example: 'S3curePass!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Full name of the business owner.', example: 'Priya Sharma' })
  @IsString()
  fullName: string;
}
