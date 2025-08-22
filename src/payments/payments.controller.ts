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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { PaymentResponseDto, PaymentListResponseDto, PaymentStatsResponseDto, ReceiptResponseDto } from './dto/payment-response.dto';
import { JwtAccessGuard } from '../common/guards/jwt-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolePermissionGuard } from '../common/guards/role-permission.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/guards/role-permission.guard';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAccessGuard, RolesGuard)
export class PaymentsController {
    constructor(private payments: PaymentsService) { }

    @ApiOperation({ summary: 'Criar novo pagamento' })
    @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso', type: PaymentResponseDto })
    @ApiResponse({ status: 400, description: 'O valor final não pode ser negativo' })
    @Post()
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('payments', 'create')
    @UseGuards(RolePermissionGuard)
    create(@Body() dto: CreatePaymentDto, @GetUser() user: any) {
        return this.payments.create(dto, user.id);
    }

    @ApiOperation({ summary: 'Listar pagamentos com filtros e paginação' })
    @ApiResponse({ status: 200, description: 'Lista de pagamentos', type: PaymentListResponseDto })
    @Get()
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('payments', 'read')
    @UseGuards(RolePermissionGuard)
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página' })
    @ApiQuery({ name: 'clientName', required: false, type: String, description: 'Buscar por nome do cliente' })
    @ApiQuery({ name: 'paymentMethod', required: false, enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BANK_TRANSFER', 'CHECK', 'VOUCHER', 'OTHER'], description: 'Filtrar por método de pagamento' })
    @ApiQuery({ name: 'paymentStatus', required: false, enum: ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED', 'REFUNDED', 'OVERDUE'], description: 'Filtrar por status' })
    @ApiQuery({ name: 'minAmount', required: false, type: Number, description: 'Valor mínimo' })
    @ApiQuery({ name: 'maxAmount', required: false, type: Number, description: 'Valor máximo' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data de início (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data de fim (YYYY-MM-DD)' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenação' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Direção da ordenação' })
    findAll(@Query() query: ListPaymentsDto) {
        return this.payments.findAll(query);
    }

    @ApiOperation({ summary: 'Buscar pagamento por ID' })
    @ApiResponse({ status: 200, description: 'Dados do pagamento', type: PaymentResponseDto })
    @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
    @Get(':id')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('payments', 'read')
    @UseGuards(RolePermissionGuard)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.payments.findOne(id);
    }

    @ApiOperation({ summary: 'Atualizar pagamento' })
    @ApiResponse({ status: 200, description: 'Pagamento atualizado com sucesso', type: PaymentResponseDto })
    @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
    @ApiResponse({ status: 400, description: 'O valor final não pode ser negativo' })
    @Put(':id')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('payments', 'update')
    @UseGuards(RolePermissionGuard)
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePaymentDto
    ) {
        return this.payments.update(id, dto);
    }

    @ApiOperation({ summary: 'Deletar pagamento' })
    @ApiResponse({ status: 200, description: 'Pagamento deletado com sucesso' })
    @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('payments', 'delete')
    @UseGuards(RolePermissionGuard)
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.payments.remove(id);
    }

    @ApiOperation({ summary: 'Marcar pagamento como pago' })
    @ApiResponse({ status: 200, description: 'Pagamento marcado como pago', type: PaymentResponseDto })
    @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
    @ApiResponse({ status: 400, description: 'Pagamento já está pago' })
    @Patch(':id/mark-as-paid')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('payments', 'update')
    @UseGuards(RolePermissionGuard)
    markAsPaid(@Param('id', ParseUUIDPipe) id: string) {
        return this.payments.markAsPaid(id);
    }

    @ApiOperation({ summary: 'Reembolsar pagamento' })
    @ApiResponse({ status: 200, description: 'Pagamento reembolsado com sucesso', type: PaymentResponseDto })
    @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
    @ApiResponse({ status: 400, description: 'Pagamento já foi reembolsado' })
    @Patch(':id/refund')
    @Roles(Role.ADMINISTRADOR)
    @RequirePermission('payments', 'update')
    @UseGuards(RolePermissionGuard)
    refund(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { reason: string }
    ) {
        return this.payments.refund(id, body.reason);
    }

    @ApiOperation({ summary: 'Gerar recibo para pagamento' })
    @ApiResponse({ status: 200, description: 'Recibo gerado com sucesso', type: ReceiptResponseDto })
    @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
    @Post(':id/generate-receipt')
    @Roles(Role.ADMINISTRADOR, Role.RECEPCIONISTA)
    @RequirePermission('payment_receipts', 'create')
    @UseGuards(RolePermissionGuard)
    generateReceipt(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: any) {
        return this.payments.generateReceipt(id, user.id);
    }

    @ApiOperation({ summary: 'Estatísticas dos pagamentos' })
    @ApiResponse({ status: 200, description: 'Estatísticas dos pagamentos', type: PaymentStatsResponseDto })
    @Get('stats/overview')
    @Roles(Role.ADMINISTRADOR, Role.MEDICO, Role.RECEPCIONISTA)
    @RequirePermission('payments', 'read')
    @UseGuards(RolePermissionGuard)
    getStats() {
        return this.payments.getStats();
    }
}
