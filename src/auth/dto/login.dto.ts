import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Registered email address.', example: 'owner@business.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Account password.', example: 'S3curePass!' })
  @IsString()
  password: string;
}
