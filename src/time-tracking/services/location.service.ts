import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface AllowedLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // em metros
}

@Injectable()
export class LocationService {
  constructor(private configService: ConfigService) {}

  /**
   * Valida se uma localização está dentro dos locais permitidos
   * @param location Localização a ser validada
   * @param allowedLocations Lista de locais permitidos
   * @returns true se a localização for válida
   */
  validateLocation(location: LocationData, allowedLocations: AllowedLocation[]): boolean {
    if (!allowedLocations || allowedLocations.length === 0) {
      return true; // Se não há restrições, permite qualquer localização
    }

    for (const allowedLocation of allowedLocations) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        allowedLocation.latitude,
        allowedLocation.longitude
      );

      if (distance <= allowedLocation.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
   * @param lat1 Latitude do primeiro ponto
   * @param lon1 Longitude do primeiro ponto
   * @param lat2 Latitude do segundo ponto
   * @param lon2 Longitude do segundo ponto
   * @returns Distância em metros
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Converte graus para radianos
   * @param degrees Graus
   * @returns Radianos
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Valida se as coordenadas são válidas
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns true se as coordenadas forem válidas
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Obtém informações de endereço a partir de coordenadas (mock)
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns Informações do endereço
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<{
    address: string;
    city: string;
    state: string;
    country: string;
  }> {
    // Em produção, integrar com uma API de geocodificação reversa como Google Maps API
    // Por enquanto, retorna dados mock
    return {
      address: `Rua das Flores, 123 - Centro`,
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil'
    };
  }

  /**
   * Verifica se a precisão da localização é aceitável
   * @param accuracy Precisão em metros
   * @param maxAccuracy Precisão máxima aceitável em metros
   * @returns true se a precisão for aceitável
   */
  validateAccuracy(accuracy: number, maxAccuracy: number = 100): boolean {
    return accuracy <= maxAccuracy;
  }

  /**
   * Cria configurações padrão de locais permitidos
   * @returns Lista de locais permitidos padrão
   */
  getDefaultAllowedLocations(): AllowedLocation[] {
    return [
      {
        name: 'Escritório Principal',
        latitude: -23.5505, // São Paulo
        longitude: -46.6333,
        radius: 100 // 100 metros
      }
    ];
  }

  /**
   * Valida se o horário de registro está dentro do horário de trabalho
   * @param timestamp Timestamp do registro
   * @param workingHours Horários de trabalho configurados
   * @param timezone Fuso horário
   * @returns true se estiver no horário de trabalho
   */
  validateWorkingHours(
    timestamp: Date,
    workingHours: any,
    timezone: string = 'America/Sao_Paulo'
  ): boolean {
    if (!workingHours) {
      return true; // Se não há restrições de horário
    }

    const date = new Date(timestamp);
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    // Verificar se é dia útil
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return workingHours.allowWeekends || false;
    }

    // Verificar horário de trabalho
    const hour = date.getHours();
    const minute = date.getMinutes();
    const currentTime = hour * 60 + minute;

    const startTime = this.parseTime(workingHours.startTime || '08:00');
    const endTime = this.parseTime(workingHours.endTime || '18:00');

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Converte string de tempo (HH:MM) para minutos
   * @param timeString String de tempo no formato HH:MM
   * @returns Minutos desde meia-noite
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Detecta se a localização pode ser falsa (mock para validação básica)
   * @param location Dados da localização
   * @returns true se a localização parecer suspeita
   */
  detectSuspiciousLocation(location: LocationData): boolean {
    // Verificações básicas para detectar localizações suspeitas
    
    // 1. Verificar se a precisão é muito baixa
    if (location.accuracy && location.accuracy > 1000) {
      return true;
    }

    // 2. Verificar se as coordenadas são muito redondas (possivelmente falsas)
    const latDecimal = location.latitude % 1;
    const lonDecimal = location.longitude % 1;
    
    if (Math.abs(latDecimal) < 0.001 || Math.abs(lonDecimal) < 0.001) {
      return true;
    }

    // 3. Verificar se está em locais conhecidos por serem usados em mocks
    const suspiciousLocations = [
      { lat: 0, lon: 0 }, // Centro do mundo
      { lat: 37.7749, lon: -122.4194 }, // São Francisco (comum em mocks)
      { lat: 40.7128, lon: -74.0060 }, // Nova York (comum em mocks)
    ];

    for (const suspicious of suspiciousLocations) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        suspicious.lat,
        suspicious.lon
      );
      
      if (distance < 100) { // Menos de 100 metros
        return true;
      }
    }

    return false;
  }
}
