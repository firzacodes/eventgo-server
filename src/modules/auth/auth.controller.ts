import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { RegisterSchema } from './dto/auth.schema';
import type { LoginDto, RegisterDto } from './dto/auth.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Req() req) {
    return this.auth.refreshTokens(req.user.sub, req.user.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req) {
    return this.auth.logout(req.user.sub);
  }
}
