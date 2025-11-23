import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartnerDto, userId: string) {
    const exists = await this.prisma.partner.findUnique({
      where: { document: dto.document },
    });
    if (exists) throw new ConflictException('Documento já cadastrado');

    return this.prisma.partner.create({
      data: {
        name: dto.name,
        documentType: dto.documentType,
        document: dto.document,
        partnerDiscount: dto.partnerDiscount ?? 0,
        clientDiscount: dto.clientDiscount ?? 0,
        fixedDiscount: dto.fixedDiscount ?? null,
        notes: dto.notes ?? null,
        isActive: dto.isActive ?? true,
        createdBy: userId,
      },
    });
  }

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.partner.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Parceiro não encontrado');
    return partner;
  }

  async update(id: string, dto: UpdatePartnerDto) {
    const existing = await this.prisma.partner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parceiro não encontrado');

    if (dto.document && dto.document !== existing.document) {
      const exists = await this.prisma.partner.findUnique({
        where: { document: dto.document },
      });
      if (exists) throw new ConflictException('Documento já cadastrado');
    }

    return this.prisma.partner.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        documentType: dto.documentType ?? existing.documentType,
        document: dto.document ?? existing.document,
        partnerDiscount: dto.partnerDiscount ?? existing.partnerDiscount,
        clientDiscount: dto.clientDiscount ?? existing.clientDiscount,
        fixedDiscount:
          dto.fixedDiscount === undefined
            ? existing.fixedDiscount
            : dto.fixedDiscount,
        notes: dto.notes === undefined ? existing.notes : dto.notes,
        isActive: dto.isActive === undefined ? existing.isActive : dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.partner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Parceiro não encontrado');
    await this.prisma.partner.delete({ where: { id } });
    return { message: 'Parceiro deletado com sucesso' };
  }
}
