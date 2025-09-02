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
import { StockService } from './stock.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { CreateStockMovementDto } from './dto/stock-movement.dto';
import { ProductResponseDto, ProductListResponseDto, StockStatsResponseDto, StockMovementResponseDto, StockAlertResponseDto } from './dto/product-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Stock Management')
@Controller('stock')
@UseGuards(JwtAccessGuard, RolesGuard)
export class StockController {
    constructor(private stockService: StockService) { }

    // ===== PRODUTOS =====
    @ApiOperation({ summary: 'Criar novo produto' })
    @ApiResponse({ status: 201, description: 'Produto criado com sucesso', type: ProductResponseDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    @ApiResponse({ status: 409, description: 'SKU ou código de barras já existe' })
    @Post('products')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('products', 'create')
    @UseGuards(RolePermissionGuard)
    createProduct(@Body() dto: CreateProductDto, @GetUser() user: any) {
        return this.stockService.createProduct(dto, user.id);
    }

    @ApiOperation({ summary: 'Listar produtos com filtros e paginação' })
    @ApiResponse({ status: 200, description: 'Lista de produtos', type: ProductListResponseDto })
    @Get('products')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('products', 'read')
    @UseGuards(RolePermissionGuard)
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
    @ApiQuery({ name: 'name', required: false, type: String, description: 'Buscar por nome' })
    @ApiQuery({ name: 'sku', required: false, type: String, description: 'Buscar por SKU' })
    @ApiQuery({ name: 'barcode', required: false, type: String, description: 'Buscar por código de barras' })
    @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filtrar por categoria' })
    @ApiQuery({ name: 'supplierId', required: false, type: String, description: 'Filtrar por fornecedor' })
    @ApiQuery({ name: 'unit', required: false, enum: ['UNIT', 'ML', 'GRAM', 'PACKAGE', 'BOTTLE', 'TUBE', 'AMPOULE', 'SYRINGE', 'OTHER'], description: 'Filtrar por unidade' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por status ativo' })
    @ApiQuery({ name: 'lowStock', required: false, type: Boolean, description: 'Filtrar por produtos com estoque baixo' })
    @ApiQuery({ name: 'expiringSoon', required: false, type: Boolean, description: 'Filtrar por produtos vencendo em breve' })
    @ApiQuery({ name: 'requiresPrescription', required: false, type: Boolean, description: 'Filtrar por produtos que requerem prescrição' })
    @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Valor mínimo de preço' })
    @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Valor máximo de preço' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenação' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Direção da ordenação' })
    findAllProducts(@Query() query: ListProductsDto) {
        return this.stockService.findAllProducts(query);
    }

    @ApiOperation({ summary: 'Buscar produto por ID' })
    @ApiResponse({ status: 200, description: 'Dados do produto', type: ProductResponseDto })
    @ApiResponse({ status: 404, description: 'Produto não encontrado' })
    @Get('products/:id')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('products', 'read')
    @UseGuards(RolePermissionGuard)
    findOneProduct(@Param('id') id: string) {
        return this.stockService.findOneProduct(id);
    }

    @ApiOperation({ summary: 'Atualizar produto' })
    @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso', type: ProductResponseDto })
    @ApiResponse({ status: 404, description: 'Produto não encontrado' })
    @ApiResponse({ status: 409, description: 'SKU ou código de barras já existe' })
    @Put('products/:id')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('products', 'update')
    @UseGuards(RolePermissionGuard)
    updateProduct(
        @Param('id') id: string,
        @Body() dto: UpdateProductDto
    ) {
        return this.stockService.updateProduct(id, dto);
    }

    @ApiOperation({ summary: 'Deletar produto' })
    @ApiResponse({ status: 200, description: 'Produto deletado com sucesso' })
    @ApiResponse({ status: 404, description: 'Produto não encontrado' })
    @Delete('products/:id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('products', 'delete')
    @UseGuards(RolePermissionGuard)
    removeProduct(@Param('id') id: string) {
        return this.stockService.removeProduct(id);
    }

    // ===== MOVIMENTAÇÕES DE ESTOQUE =====
    @ApiOperation({ summary: 'Criar movimentação de estoque' })
    @ApiResponse({ status: 201, description: 'Movimentação criada com sucesso', type: StockMovementResponseDto })
    @ApiResponse({ status: 400, description: 'Estoque insuficiente ou dados inválidos' })
    @ApiResponse({ status: 404, description: 'Produto não encontrado' })
    @Post('movements')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('stock_movements', 'create')
    @UseGuards(RolePermissionGuard)
    createStockMovement(@Body() dto: CreateStockMovementDto, @GetUser() user: any) {
        return this.stockService.createStockMovement(dto, user.id);
    }

    @ApiOperation({ summary: 'Listar movimentações de estoque' })
    @ApiResponse({ status: 200, description: 'Lista de movimentações' })
    @Get('movements')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('stock_movements', 'read')
    @UseGuards(RolePermissionGuard)
    @ApiQuery({ name: 'productId', required: false, type: String, description: 'Filtrar por produto' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
    getStockMovements(
        @Query('productId') productId?: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ) {
        return this.stockService.getStockMovements(productId, page, limit);
    }

    // ===== ALERTAS DE ESTOQUE =====
    @ApiOperation({ summary: 'Listar alertas de estoque' })
    @ApiResponse({ status: 200, description: 'Lista de alertas', type: [StockAlertResponseDto] })
    @Get('alerts')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('stock_alerts', 'read')
    @UseGuards(RolePermissionGuard)
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por alertas ativos', default: true })
    getStockAlerts(@Query('isActive') isActive = true) {
        return this.stockService.getStockAlerts(isActive);
    }

    @ApiOperation({ summary: 'Resolver alerta de estoque' })
    @ApiResponse({ status: 200, description: 'Alerta resolvido com sucesso', type: StockAlertResponseDto })
    @ApiResponse({ status: 404, description: 'Alerta não encontrado' })
    @Patch('alerts/:id/resolve')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('stock_alerts', 'update')
    @UseGuards(RolePermissionGuard)
    resolveAlert(
        @Param('id') id: string,
        @Body() body: { notes?: string }
    ) {
        return this.stockService.resolveAlert(id, body.notes);
    }

    // ===== ESTATÍSTICAS =====
    @ApiOperation({ summary: 'Estatísticas do estoque' })
    @ApiResponse({ status: 200, description: 'Estatísticas do estoque', type: StockStatsResponseDto })
    @Get('stats')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('products', 'read')
    @UseGuards(RolePermissionGuard)
    getStockStats() {
        return this.stockService.getStockStats();
    }

    // ===== CONSUMO AUTOMÁTICO =====
    @ApiOperation({ summary: 'Consumir produtos para um serviço' })
    @ApiResponse({ status: 200, description: 'Produtos consumidos com sucesso' })
    @ApiResponse({ status: 400, description: 'Estoque insuficiente' })
    @ApiResponse({ status: 404, description: 'Serviço não encontrado' })
    @Post('services/:serviceId/consume')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('stock_movements', 'create')
    @UseGuards(RolePermissionGuard)
    consumeProductsForService(
        @Param('serviceId') serviceId: string,
        @GetUser() user: any
    ) {
        return this.stockService.consumeProductsForService(serviceId, user.id);
    }
}
