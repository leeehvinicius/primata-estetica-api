import { ApiProperty } from '@nestjs/swagger';
import { Gender, FormalTitle } from '@prisma/client';

export class ClientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ required: false })
  birthDate?: Date;

  @ApiProperty({ enum: Gender, required: false })
  gender?: Gender;

  @ApiProperty({ enum: FormalTitle, required: false })
  formalTitle?: FormalTitle;

  @ApiProperty({ required: false })
  formalTitleOther?: string;

  @ApiProperty({ required: false })
  document?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  state?: string;

  @ApiProperty({ required: false })
  zipCode?: string;

  @ApiProperty({ required: false })
  emergencyContact?: string;

  @ApiProperty({ required: false })
  emergencyPhone?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ description: 'Se o paciente aceitou os termos de uso' })
  termsAccepted: boolean;

  @ApiProperty({
    description: 'Data/hora em que os termos foram aceitos',
    required: false,
  })
  termsAcceptedAt?: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ClientListResponseDto {
  @ApiProperty({ type: [ClientResponseDto] })
  clients: ClientResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}

export class ClientStatsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  inactive: number;

  @ApiProperty()
  byGender: Record<Gender, number>;

  @ApiProperty()
  newThisMonth: number;

  @ApiProperty()
  newThisYear: number;
}
