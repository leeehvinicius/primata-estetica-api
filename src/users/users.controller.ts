import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private users: UsersService) { }

    @Post()
    register(@Body() dto: CreateUserDto) {
        return this.users.create(dto);
    }

    @UseGuards(JwtAccessGuard)
    @Get('me')
    me(@GetUser('sub') userId: string) {
        return this.users.me(userId);
    }
}
