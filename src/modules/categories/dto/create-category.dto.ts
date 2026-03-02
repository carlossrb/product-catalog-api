import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Vestuário' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name!: string;

  @ApiPropertyOptional({ example: 'uuid-da-categoria-pai' })
  @IsUUID()
  @IsOptional()
  readonly parentId?: string;
}
