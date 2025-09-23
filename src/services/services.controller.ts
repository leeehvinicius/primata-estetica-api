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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServicesDto } from './dto/list-services.dto';
import { ServiceResponseDto, ServiceListResponseDto, ServiceStatsResponseDto } from './dto/service-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ListServiceCategoriesDto } from './dto/list-service-categories.dto';

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAccessGuard, RolesGuard)
export class ServicesController {
    constructor(private services: ServicesService) { }

    @ApiOperation({ summary: 'Criar novo serviço' })
    @ApiResponse({ status: 201, description: 'Serviço criado com sucesso', type: ServiceResponseDto })
    @ApiResponse({ status: 409, description: 'Serviço com este nome já existe' })
    @Post()
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('services', 'create')
    @UseGuards(RolePermissionGuard)
    create(@Body() dto: CreateServiceDto, @GetUser() user: any) {
        return this.services.create(dto, user.id);
    }

    @ApiOperation({ summary: 'Listar serviços com filtros e paginação' })
    @ApiResponse({ status: 200, description: 'Lista de serviços', type: ServiceListResponseDto })
    @Get()
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('services', 'read')
    @UseGuards(RolePermissionGuard)
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nome ou descrição' })
    @ApiQuery({ name: 'serviceCategoryId', required: false, type: String, description: 'Filtrar por categoria (ID)' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por status ativo' })
    @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Filtrar por preço mínimo' })
    @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Filtrar por preço máximo' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenação' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Direção da ordenação' })
    findAll(@Query() query: ListServicesDto) {
        return this.services.findAll(query);
    }

    @ApiOperation({ summary: 'Buscar serviço por ID' })
    @ApiResponse({ status: 200, description: 'Dados do serviço', type: ServiceResponseDto })
    @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
    @Get(':id')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('services', 'read')
    @UseGuards(RolePermissionGuard)
    findOne(@Param('id') id: string) {
        return this.services.findOne(id);
    }

    @ApiOperation({ summary: 'Atualizar serviço' })
    @ApiResponse({ status: 200, description: 'Serviço atualizado com sucesso', type: ServiceResponseDto })
    @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
    @ApiResponse({ status: 409, description: 'Serviço com este nome já existe' })
    @Put(':id')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('services', 'update')
    @UseGuards(RolePermissionGuard)
    update(
        @Param('id') id: string,
        @Body() dto: UpdateServiceDto
    ) {
        return this.services.update(id, dto);
    }

    @ApiOperation({ summary: 'Deletar serviço' })
    @ApiResponse({ status: 200, description: 'Serviço deletado com sucesso' })
    @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('services', 'delete')
    @UseGuards(RolePermissionGuard)
    remove(@Param('id') id: string) {
        return this.services.remove(id);
    }

    @ApiOperation({ summary: 'Alternar status do serviço (ativo/inativo)' })
    @ApiResponse({ status: 200, description: 'Status alterado com sucesso', type: ServiceResponseDto })
    @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
    @Patch(':id/toggle-status')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('services', 'update')
    @UseGuards(RolePermissionGuard)
    toggleStatus(@Param('id') id: string) {
        return this.services.toggleStatus(id);
    }

    @ApiOperation({ summary: 'Estatísticas dos serviços' })
    @ApiResponse({ status: 200, description: 'Estatísticas dos serviços', type: ServiceStatsResponseDto })
    @Get('stats/overview')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('services', 'read')
    @UseGuards(RolePermissionGuard)
    getStats() {
        return this.services.getStats();
    }

    @ApiOperation({ summary: 'Buscar serviços por nome' })
    @ApiResponse({ status: 200, description: 'Lista de serviços encontrados' })
    @Get('search/name/:name')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('services', 'read')
    @UseGuards(RolePermissionGuard)
    searchByName(@Param('name') name: string) {
        return this.services.searchByName(name);
    }

    @ApiOperation({ summary: 'Buscar serviços por categoria (ID)' })
    @ApiResponse({ status: 200, description: 'Lista de serviços por categoria' })
    @Get('search/category/:serviceCategoryId')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('services', 'read')
    @UseGuards(RolePermissionGuard)
    searchByCategory(@Param('serviceCategoryId') serviceCategoryId: string) {
        return this.services.searchByCategory(serviceCategoryId);
    }

    @ApiOperation({ summary: 'Buscar serviços por faixa de preço' })
    @ApiResponse({ status: 200, description: 'Lista de serviços por faixa de preço' })
    @Get('search/price-range/:minPrice/:maxPrice')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('services', 'read')
    @UseGuards(RolePermissionGuard)
    getServicesByPriceRange(
        @Param('minPrice') minPrice: string,
        @Param('maxPrice') maxPrice: string
    ) {
        return this.services.getServicesByPriceRange(Number(minPrice), Number(maxPrice));
    }

    @ApiOperation({ summary: 'Buscar serviços por duração máxima' })
    @ApiResponse({ status: 200, description: 'Lista de serviços por duração máxima' })
    @Get('search/duration/:maxDuration')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('services', 'read')
    @UseGuards(RolePermissionGuard)
    getServicesByDuration(@Param('maxDuration') maxDuration: string) {
        return this.services.getServicesByDuration(Number(maxDuration));
    }

    // ===== SERVICE CATEGORIES =====
    @ApiOperation({ summary: 'Criar categoria de serviço' })
    @Post('categories')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('service_categories', 'create')
    @UseGuards(RolePermissionGuard)
    createServiceCategory(@Body() dto: CreateServiceCategoryDto, @GetUser() user: any) {
        return this.services.createServiceCategory(dto, user.id);
    }

    @ApiOperation({ summary: 'Listar categorias de serviço' })
    @Get('categories')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('service_categories', 'read')
    @UseGuards(RolePermissionGuard)
    @ApiQuery({ name: 'name', required: false, type: String })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    listServiceCategories(@Query() query: ListServiceCategoriesDto) {
        return this.services.listServiceCategories(query);
    }

    @ApiOperation({ summary: 'Buscar categoria de serviço por ID' })
    @Get('categories/:id')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('service_categories', 'read')
    @UseGuards(RolePermissionGuard)
    getServiceCategory(@Param('id') id: string) {
        return this.services.getServiceCategory(id);
    }

    @ApiOperation({ summary: 'Atualizar categoria de serviço' })
    @Put('categories/:id')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('service_categories', 'update')
    @UseGuards(RolePermissionGuard)
    updateServiceCategory(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
        return this.services.updateServiceCategory(id, dto);
    }

    @ApiOperation({ summary: 'Alternar status da categoria de serviço' })
    @Patch('categories/:id/toggle-status')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('service_categories', 'update')
    @UseGuards(RolePermissionGuard)
    toggleServiceCategoryStatus(@Param('id') id: string) {
        return this.services.toggleServiceCategoryStatus(id);
    }

    @ApiOperation({ summary: 'Deletar categoria de serviço' })
    @Delete('categories/:id')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('service_categories', 'delete')
    @UseGuards(RolePermissionGuard)
    removeServiceCategory(@Param('id') id: string) {
        return this.services.removeServiceCategory(id);
    }
}
