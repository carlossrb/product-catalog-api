import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryAuditDto {
  @ApiPropertyOptional({ example: 'PRODUCT_CREATED' })
  @IsString()
  @IsOptional()
  readonly action?: string;

  @ApiPropertyOptional({ example: 'Product' })
  @IsString()
  @IsOptional()
  readonly entityType?: string;

  @ApiPropertyOptional({ example: 'uuid-da-entidade' })
  @IsString()
  @IsOptional()
  readonly entityId?: string;

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
