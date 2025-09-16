import { Body, Controller, Get, Post, Put, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard, RequirePermission } from '../common/guards/role-permission.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Partners')
@ApiBearerAuth()
@Controller('partners')
@UseGuards(JwtAccessGuard, RolesGuard)
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @ApiOperation({ summary: 'Criar parceiro' })
  @ApiResponse({ status: 201, description: 'Parceiro criado' })
  @Post()
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @RequirePermission('partners', 'create')
  @UseGuards(RolePermissionGuard)
  create(@Body() dto: CreatePartnerDto, @GetUser() user: any) {
    return this.partners.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Listar parceiros' })
  @ApiResponse({ status: 200, description: 'Lista parceiros' })
  @Get()
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('partners', 'read')
  @UseGuards(RolePermissionGuard)
  findAll(@Query('search') search?: string) {
    return this.partners.findAll(search);
  }

  @ApiOperation({ summary: 'Buscar parceiro por ID' })
  @ApiResponse({ status: 200, description: 'Parceiro' })
  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
  @RequirePermission('partners', 'read')
  @UseGuards(RolePermissionGuard)
  findOne(@Param('id') id: string) {
    return this.partners.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar parceiro' })
  @ApiResponse({ status: 200, description: 'Parceiro atualizado' })
  @Put(':id')
  @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
  @RequirePermission('partners', 'update')
  @UseGuards(RolePermissionGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partners.update(id, dto);
  }

  @ApiOperation({ summary: 'Deletar parceiro' })
  @ApiResponse({ status: 200, description: 'Parceiro deletado' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMINISTRADOR)
  @RequirePermission('partners', 'delete')
  @UseGuards(RolePermissionGuard)
  remove(@Param('id') id: string) {
    return this.partners.remove(id);
  }
}


