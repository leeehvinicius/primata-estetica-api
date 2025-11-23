import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TimeTrackingService } from './time-tracking.service';
import { RegisterTimeTrackingDto } from './dto/register-time-tracking.dto';
import { ValidateTimeTrackingDto } from './dto/validate-time-tracking.dto';
import { TimeTrackingQueryDto } from './dto/time-tracking-query.dto';
import { UpdateTimeTrackingSettingsDto } from './dto/time-tracking-settings.dto';
import {
  GenerateTimeTrackingReportDto,
  TimeTrackingReportQueryDto,
} from './dto/time-tracking-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PhotoCaptureService } from './services/photo-capture.service';

@ApiTags('Time Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(
    private readonly timeTrackingService: TimeTrackingService,
    private readonly photoCaptureService: PhotoCaptureService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar ponto eletrônico' })
  @ApiResponse({ status: 201, description: 'Ponto registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async registerTimeTracking(
    @Body() registerDto: RegisterTimeTrackingDto,
    @GetUser('id') userId: string,
    @Request() request: any,
  ) {
    return this.timeTrackingService.registerTimeTracking(
      registerDto,
      userId,
      request,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar registros de ponto' })
  @ApiResponse({ status: 200, description: 'Lista de registros de ponto' })
  async getTimeTrackings(
    @Query() query: TimeTrackingQueryDto,
    @GetUser('id') userId: string,
  ) {
    return this.timeTrackingService.getTimeTrackings(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar registro de ponto por ID' })
  @ApiResponse({ status: 200, description: 'Registro de ponto encontrado' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async getTimeTrackingById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.timeTrackingService.getTimeTrackingById(id, userId);
  }

  @Put('validate')
  @ApiOperation({ summary: 'Validar registro de ponto' })
  @ApiResponse({ status: 200, description: 'Registro validado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão para validar' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado' })
  async validateTimeTracking(
    @Body() validateDto: ValidateTimeTrackingDto,
    @GetUser('id') validatorId: string,
  ) {
    return this.timeTrackingService.validateTimeTracking(
      validateDto,
      validatorId,
    );
  }

  @Get('settings/my')
  @ApiOperation({ summary: 'Buscar configurações de ponto do usuário' })
  @ApiResponse({ status: 200, description: 'Configurações encontradas' })
  async getMyTimeTrackingSettings(@GetUser('id') userId: string) {
    return this.timeTrackingService.getTimeTrackingSettings(userId);
  }

  @Put('settings/my')
  @ApiOperation({ summary: 'Atualizar configurações de ponto do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso',
  })
  async updateMyTimeTrackingSettings(
    @Body() settingsDto: UpdateTimeTrackingSettingsDto,
    @GetUser('id') userId: string,
  ) {
    return this.timeTrackingService.updateTimeTrackingSettings(
      userId,
      settingsDto,
    );
  }

  @Post('reports/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gerar relatório de ponto' })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async generateTimeTrackingReport(
    @Body() reportDto: GenerateTimeTrackingReportDto,
    @GetUser('id') generatorId: string,
  ) {
    return this.timeTrackingService.generateTimeTrackingReport(
      reportDto,
      generatorId,
    );
  }

  @Get('reports')
  @ApiOperation({ summary: 'Listar relatórios de ponto' })
  @ApiResponse({ status: 200, description: 'Lista de relatórios' })
  async getTimeTrackingReports(
    @Query() query: TimeTrackingReportQueryDto,
    @GetUser('id') userId: string,
  ) {
    return this.timeTrackingService.getTimeTrackingReports(query, userId);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Buscar relatório de ponto por ID' })
  @ApiResponse({ status: 200, description: 'Relatório encontrado' })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  async getTimeTrackingReportById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    // Implementar busca de relatório por ID
    // Por enquanto, retorna um mock
    return { id, message: 'Relatório encontrado' };
  }

  @Put('reports/:id/approve')
  @ApiOperation({ summary: 'Aprovar relatório de ponto' })
  @ApiResponse({ status: 200, description: 'Relatório aprovado com sucesso' })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  async approveTimeTrackingReport(
    @Param('id') id: string,
    @GetUser('id') approverId: string,
  ) {
    // Implementar aprovação de relatório
    // Por enquanto, retorna um mock
    return { id, approverId, message: 'Relatório aprovado' };
  }

  @Post('capture-location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capturar localização atual do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Localização capturada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Erro ao capturar localização' })
  async captureLocation(
    @Body()
    locationData: { latitude: number; longitude: number; accuracy?: number },
    @GetUser('id') userId: string,
  ) {
    // Validar coordenadas
    if (!locationData.latitude || !locationData.longitude) {
      throw new BadRequestException('Coordenadas são obrigatórias');
    }

    // Retornar informações da localização
    return {
      success: true,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: new Date().toISOString(),
      },
      message: 'Localização capturada com sucesso',
    };
  }

  @Post('capture-photo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capturar foto do usuário' })
  @ApiResponse({ status: 200, description: 'Foto capturada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao capturar foto' })
  async capturePhoto(
    @Body() photoData: { photoData: string },
    @GetUser('id') userId: string,
  ) {
    if (!photoData.photoData) {
      throw new BadRequestException('Dados da foto são obrigatórios');
    }

    // Processar e salvar a foto
    const photoUrl = await this.photoCaptureService.processPhoto(
      photoData.photoData,
      userId,
    );

    return {
      success: true,
      photoUrl,
      message: 'Foto capturada com sucesso',
    };
  }
}
