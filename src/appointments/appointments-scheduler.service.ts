import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentsService } from './appointments.service';

@Injectable()
export class AppointmentsSchedulerService {
  private readonly logger = new Logger(AppointmentsSchedulerService.name);

  constructor(private appointmentsService: AppointmentsService) {}

  /**
   * Executar envio de lembretes a cada 5 minutos
   * Cron expression: a cada 5 minutos
   */
  @Cron('*/5 * * * *', {
    name: 'send-appointment-reminders',
    timeZone: 'America/Sao_Paulo',
  })
  async handleSendReminders() {
    this.logger.log('Executando tarefa agendada: envio de lembretes');
    try {
      const result = await this.appointmentsService.sendReminders();
      this.logger.log(
        `Tarefa concluída: ${result.sent} enviados, ${result.failed} falhas`,
      );
    } catch (error: any) {
      this.logger.error(
        `Erro ao executar tarefa agendada de lembretes: ${error.message}`,
        error.stack,
      );
    }
  }
}

