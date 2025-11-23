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
  Patch,
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { ListProfessionalsDto } from './dto/list-professionals.dto';
import {
  ProfessionalResponseDto,
  ProfessionalListResponseDto,
  ProfessionalStatsResponseDto,
} from './dto/professional-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Professionals')
@Controller('professionals')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ProfessionalsController {
  constructor(private professionals: ProfessionalsService) {}

  @ApiOperation({ summary: 'Criar novo profissional' })
  @ApiResponse({
    status: 201,
    description: 'Profissional criado com sucesso',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
  @Post()
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('professionals', 'create')
  @UseGuards(RolePermissionGuard)
  create(@Body() dto: CreateProfessionalDto) {
    return this.professionals.create(dto);
  }

  @ApiOperation({ summary: 'Listar profissionais com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profissionais',
    type: ProfessionalListResponseDto,
  })
  @Get()
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('professionals', 'read')
  @UseGuards(RolePermissionGuard)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página atual',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Buscar por nome, email, telefone, especialidade ou documento',
  })
  @ApiQuery({
    name: 'specialty',
    required: false,
    type: String,
    description: 'Filtrar por especialidade',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    description: 'Filtrar por gênero',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filtrar por status ativo',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Campo para ordenação',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Direção da ordenação',
  })
  findAll(@Query() query: ListProfessionalsDto) {
    return this.professionals.findAll(query);
  }

  @ApiOperation({ summary: 'Buscar profissional por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do profissional',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('professionals', 'read')
  @UseGuards(RolePermissionGuard)
  findOne(@Param('id') id: string) {
    return this.professionals.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar profissional' })
  @ApiResponse({
    status: 200,
    description: 'Profissional atualizado com sucesso',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('professionals', 'update')
  @UseGuards(RolePermissionGuard)
  update(@Param('id') id: string, @Body() dto: UpdateProfessionalDto) {
    return this.professionals.update(id, dto);
  }

  @ApiOperation({ summary: 'Deletar profissional' })
  @ApiResponse({
    status: 200,
    description: 'Profissional deletado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('professionals', 'delete')
  @UseGuards(RolePermissionGuard)
  remove(@Param('id') id: string) {
    return this.professionals.remove(id);
  }

  @ApiOperation({ summary: 'Alternar status do profissional (ativo/inativo)' })
  @ApiResponse({
    status: 200,
    description: 'Status alterado com sucesso',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profissional não encontrado' })
  @Patch(':id/toggle-status')
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('professionals', 'update')
  @UseGuards(RolePermissionGuard)
  toggleStatus(@Param('id') id: string) {
    return this.professionals.toggleStatus(id);
  }

  @ApiOperation({ summary: 'Estatísticas dos profissionais' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas dos profissionais',
    type: ProfessionalStatsResponseDto,
  })
  @Get('stats/overview')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('professionals', 'read')
  @UseGuards(RolePermissionGuard)
  getStats() {
    return this.professionals.getStats();
  }

  @ApiOperation({ summary: 'Buscar profissionais por nome' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profissionais encontrados',
  })
  @Get('search/name/:name')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('professionals', 'read')
  @UseGuards(RolePermissionGuard)
  searchByName(@Param('name') name: string) {
    return this.professionals.searchByName(name);
  }

  @ApiOperation({ summary: 'Buscar profissionais por especialidade' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profissionais por especialidade',
  })
  @Get('search/specialty/:specialty')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('professionals', 'read')
  @UseGuards(RolePermissionGuard)
  searchBySpecialty(@Param('specialty') specialty: string) {
    return this.professionals.searchBySpecialty(specialty);
  }

  @ApiOperation({ summary: 'Buscar profissionais disponíveis para uma data' })
  @ApiResponse({
    status: 200,
    description: 'Lista de profissionais disponíveis',
  })
  @Get('available/:date')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('professionals', 'read')
  @UseGuards(RolePermissionGuard)
  getAvailableProfessionals(@Param('date') date: string) {
    return this.professionals.getAvailableProfessionals(new Date(date));
  }
}
