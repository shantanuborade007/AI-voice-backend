import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new business owner',
    description: 'Creates a new user with role `business_owner` and returns a JWT access token. Public endpoint - no authentication required. Emails must be unique.',
  })
  @ApiCreatedResponse({ description: 'Account created.', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed (e.g. invalid email, password shorter than 8 characters).' })
  @ApiConflictResponse({ description: 'An account with this email already exists.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Log in',
    description: 'Verifies email/password and returns a JWT access token. Public endpoint - no authentication required.',
  })
  @ApiOkResponse({ description: 'Login succeeded.', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed (e.g. missing fields).' })
  @ApiUnauthorizedResponse({ description: 'Invalid email/password, or the account has been deactivated.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
