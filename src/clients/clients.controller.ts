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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { ClientResponseDto, ClientListResponseDto, ClientStatsResponseDto } from './dto/client-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ClientsController {
    constructor(private clients: ClientsService) { }

    @ApiOperation({ summary: 'Criar novo cliente' })
    @ApiResponse({ status: 201, description: 'Cliente criado com sucesso', type: ClientResponseDto })
    @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
    @Post()
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'create')
    @UseGuards(RolePermissionGuard)
    create(@Body() dto: CreateClientDto) {
        return this.clients.create(dto);
    }

    @ApiOperation({ summary: 'Listar clientes com filtros e paginação' })
    @ApiResponse({ status: 200, description: 'Lista de clientes', type: ClientListResponseDto })
    @Get()
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'read')
    @UseGuards(RolePermissionGuard)
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nome, email, telefone ou documento' })
    @ApiQuery({ name: 'gender', required: false, enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], description: 'Filtrar por gênero' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por status ativo' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenação' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Direção da ordenação' })
    findAll(@Query() query: ListClientsDto) {
        return this.clients.findAll(query);
    }

    @ApiOperation({ summary: 'Buscar cliente por ID' })
    @ApiResponse({ status: 200, description: 'Dados do cliente', type: ClientResponseDto })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    @Get(':id')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'read')
    @UseGuards(RolePermissionGuard)
    findOne(@Param('id') id: string) {
        return this.clients.findOne(id);
    }

    @ApiOperation({ summary: 'Atualizar cliente' })
    @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso', type: ClientResponseDto })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
    @Put(':id')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'update')
    @UseGuards(RolePermissionGuard)
    update(
        @Param('id') id: string,
        @Body() dto: UpdateClientDto
    ) {
        return this.clients.update(id, dto);
    }

    @ApiOperation({ summary: 'Deletar cliente' })
    @ApiResponse({ status: 200, description: 'Cliente deletado com sucesso' })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('clients', 'delete')
    @UseGuards(RolePermissionGuard)
    remove(@Param('id') id: string) {
        return this.clients.remove(id);
    }

    @ApiOperation({ summary: 'Alternar status do cliente (ativo/inativo)' })
    @ApiResponse({ status: 200, description: 'Status alterado com sucesso', type: ClientResponseDto })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    @Patch(':id/toggle-status')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'update')
    @UseGuards(RolePermissionGuard)
    toggleStatus(@Param('id') id: string) {
        return this.clients.toggleStatus(id);
    }

    @ApiOperation({ summary: 'Estatísticas dos clientes' })
    @ApiResponse({ status: 200, description: 'Estatísticas dos clientes', type: ClientStatsResponseDto })
    @Get('stats/overview')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'read')
    @UseGuards(RolePermissionGuard)
    getStats() {
        return this.clients.getStats();
    }

    @ApiOperation({ summary: 'Buscar clientes por nome' })
    @ApiResponse({ status: 200, description: 'Lista de clientes encontrados' })
    @Get('search/name/:name')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'read')
    @UseGuards(RolePermissionGuard)
    searchByName(@Param('name') name: string) {
        return this.clients.searchByName(name);
    }

    @ApiOperation({ summary: 'Histórico completo do cliente' })
    @ApiResponse({ status: 200, description: 'Histórico do cliente com atendimentos, histórico médico e tratamentos' })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    @Get(':id/history')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('clients', 'read')
    @UseGuards(RolePermissionGuard)
    getClientHistory(@Param('id') id: string) {
        return this.clients.getClientHistory(id);
    }
}
