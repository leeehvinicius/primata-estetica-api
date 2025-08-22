import { 
    Body, 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Param, 
    UseGuards,
    ParseUUIDPipe,
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
@UseGuards(JwtAccessGuard, RolesGuard)
export class UsersController {
    constructor(private users: UsersService) { }

    @ApiOperation({ summary: 'Criar novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserResponseDto })
    @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
    @Post()
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'create')
    @UseGuards(RolePermissionGuard)
    register(@Body() dto: CreateUserDto) {
        return this.users.create(dto);
    }

    @ApiOperation({ summary: 'Listar usuários com filtros e paginação' })
    @ApiResponse({ status: 200, description: 'Lista de usuários', type: UserListResponseDto })
    @Get()
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'read')
    @UseGuards(RolePermissionGuard)
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

    @ApiOperation({ summary: 'Buscar usuário por ID' })
    @ApiResponse({ status: 200, description: 'Dados do usuário', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @Get(':id')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'read')
    @UseGuards(RolePermissionGuard)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.users.findOne(id);
    }

    @ApiOperation({ summary: 'Atualizar usuário' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @Put(':id')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'update')
    @UseGuards(RolePermissionGuard)
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto,
        @GetUser('sub') currentUserId: string,
        @GetUser('role') currentUserRole: Role
    ) {
        return this.users.update(id, dto, currentUserRole);
    }

    @ApiOperation({ summary: 'Deletar usuário' })
    @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'delete')
    @UseGuards(RolePermissionGuard)
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @GetUser('role') currentUserRole: Role
    ) {
        return this.users.remove(id, currentUserRole);
    }

    @ApiOperation({ summary: 'Alternar status do usuário (ativo/inativo)' })
    @ApiResponse({ status: 200, description: 'Status alterado com sucesso', type: UserResponseDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @Patch(':id/toggle-status')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'update')
    @UseGuards(RolePermissionGuard)
    toggleStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @GetUser('role') currentUserRole: Role
    ) {
        return this.users.toggleUserStatus(id, currentUserRole);
    }

    @ApiOperation({ summary: 'Dados do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Dados do usuário autenticado', type: UserResponseDto })
    @Get('me')
    me(@GetUser('sub') userId: string) {
        return this.users.me(userId);
    }

    @ApiOperation({ summary: 'Estatísticas dos usuários' })
    @ApiResponse({ status: 200, description: 'Estatísticas dos usuários', type: UserStatsResponseDto })
    @Get('stats/overview')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('users', 'read')
    @UseGuards(RolePermissionGuard)
    getStats() {
        return this.users.getStats();
    }

    @ApiOperation({ summary: 'Listar todos os roles disponíveis' })
    @ApiResponse({ status: 200, description: 'Lista de roles com descrições' })
    @Get('roles/list')
    @Roles(Role.ADMINISTRADOR)
    getRoles() {
        return this.users.getRoles();
    }

    @ApiOperation({ summary: 'Informações de um role específico' })
    @ApiResponse({ status: 200, description: 'Informações do role' })
    @Get('roles/:role')
    @Roles(Role.ADMINISTRADOR)
    getRoleInfo(@Param('role') role: Role) {
        return this.users.getRoleInfo(role);
    }
}

