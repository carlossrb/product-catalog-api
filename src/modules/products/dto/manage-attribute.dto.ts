import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddAttributeDto {
  @ApiProperty({ example: 'cor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly key!: string;

  @ApiProperty({ example: 'azul' })
  @IsString()
  @IsNotEmpty()
  readonly value!: string;
}

export class UpdateAttributeDto {
  @ApiPropertyOptional({ example: 'cor' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly key?: string;

  @ApiPropertyOptional({ example: 'vermelho' })
  @IsString()
  @IsOptional()
  readonly value?: string;
}
