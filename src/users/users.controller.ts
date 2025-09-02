import { 
    Body, 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Param, 
    UseGuards,
    HttpCode,
    HttpStatus,
    Query,
    Patch
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UserResponseDto, UserListResponseDto, UserStatsResponseDto } from './dto/user-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAccessGuard)
export class UsersController {
    constructor(private users: UsersService) { }

    @ApiOperation({ summary: 'Criar novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserResponseDto })
    @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
    @Post()
    @UseGuards(RolesGuard, RolePermissionGuard)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'create')
    register(@Body() dto: CreateUserDto) {
        return this.users.create(dto);
    }

    @ApiOperation({ summary: 'Listar usuários com filtros e paginação' })
    @ApiResponse({ status: 200, description: 'Lista de usuários', type: UserListResponseDto })
    @Get()
    @UseGuards(RolesGuard, RolePermissionGuard)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'read')
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nome, email, telefone ou documento' })
    @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Filtrar por role' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por status ativo' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenação' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Direção da ordenação' })
    findAll(@Query() query: ListUsersDto) {
        return this.users.findAll(query);
    }

    @ApiOperation({ summary: 'Dados do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Dados do usuário autenticado', type: UserResponseDto })
    @Get('me')
    me(@GetUser('sub') userId: string) {
        console.log('UsersController.me - userId:', userId);
        console.log('UsersController.me - userId type:', typeof userId);
        return this.users.me(userId);
    }

    @ApiOperation({ summary: 'Buscar usuário por ID' })
    @ApiResponse({ status: 200, description: 'Dados do usuário', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @Get(':id')
    @UseGuards(RolesGuard, RolePermissionGuard)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'read')
    findOne(@Param('id') id: string) {
        return this.users.findOne(id);
    }

    @ApiOperation({ summary: 'Atualizar usuário' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @Put(':id')
    @UseGuards(RolesGuard, RolePermissionGuard)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'update')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
        @GetUser('sub') currentUserId: string,
        @GetUser('profile') profile: any
    ) {
        return this.users.update(id, dto, profile.role);
    }

    @ApiOperation({ summary: 'Deletar usuário' })
    @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RolesGuard, RolePermissionGuard)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'delete')
    remove(
        @Param('id') id: string,
        @GetUser('profile') profile: any
    ) {
        return this.users.remove(id, profile.role);
    }

    @ApiOperation({ summary: 'Alternar status do usuário (ativo/inativo)' })
    @ApiResponse({ status: 200, description: 'Status alterado com sucesso', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @Patch(':id/toggle-status')
    @UseGuards(RolesGuard, RolePermissionGuard)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'update')
    toggleStatus(
        @Param('id') id: string,
        @GetUser('profile') profile: any
    ) {
        return this.users.toggleUserStatus(id, profile.role);
    }

    @ApiOperation({ summary: 'Estatísticas dos usuários' })
    @ApiResponse({ status: 200, description: 'Estatísticas dos usuários', type: UserStatsResponseDto })
    @Get('stats/overview')
    @UseGuards(RolesGuard, RolePermissionGuard)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'read')
    getStats() {
        return this.users.getStats();
    }

    @ApiOperation({ summary: 'Listar todos os roles disponíveis' })
    @ApiResponse({ status: 200, description: 'Lista de roles com descrições' })
    @Get('roles/list')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMINISTRADOR)
    getRoles() {
        return this.users.getRoles();
    }

    @ApiOperation({ summary: 'Informações de um role específico' })
    @ApiResponse({ status: 200, description: 'Informações do role' })
    @Get('roles/:role')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMINISTRADOR)
    getRoleInfo(@Param('role') role: Role) {
        return this.users.getRoleInfo(role);
    }
}

