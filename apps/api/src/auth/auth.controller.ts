import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);

    response.cookie('vdevs_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.expiresAt,
      path: '/',
    });

    return {
      user: result.user,
    };
  }

  @Get('me')
  async me(@Req() request: Request) {
    const sessionToken = request.cookies?.vdevs_session;

    if (!sessionToken) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.authService.getCurrentUser(sessionToken);
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionToken = request.cookies?.vdevs_session;

    await this.authService.logout(sessionToken);

    response.clearCookie('vdevs_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Logged out successfully',
    };
  }
}
