import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus } from '../entities/product-status.enum';

export class QueryProductsDto {
  @ApiPropertyOptional({ example: 'camiseta' })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  readonly status?: ProductStatus;

  @ApiPropertyOptional({ enum: ['createdAt', 'updatedAt', 'name'], default: 'createdAt' })
  @IsString()
  @IsOptional()
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  readonly sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly limit?: number;
}
