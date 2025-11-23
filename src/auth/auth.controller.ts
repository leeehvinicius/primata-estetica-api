import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @ApiResponse({ status: 200, description: 'Login ok' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(
    @GetUser('sub') userId: string,
    @GetUser('refreshToken') token: string,
  ) {
    return this.auth.refresh(userId, token);
  }

  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, description: 'Logout ok' })
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@GetUser('sub') userId: string) {
    return this.auth.logout(userId);
  }
}
