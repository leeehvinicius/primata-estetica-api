import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class ProfileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    role: Role;

    @ApiProperty({ required: false })
    phone?: string;

    @ApiProperty({ required: false })
    document?: string;

    @ApiProperty({ required: false })
    avatarUrl?: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty({ required: false })
    lastLogin?: Date;
}

export class UserResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: ProfileResponseDto })
    profile: ProfileResponseDto;
}

export class UserListResponseDto {
    @ApiProperty({ type: [UserResponseDto] })
    users: UserResponseDto[];

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

export class UserStatsResponseDto {
    @ApiProperty()
    total: number;

    @ApiProperty()
    active: number;

    @ApiProperty()
    inactive: number;

    @ApiProperty()
    byRole: Record<Role, number>;
}
