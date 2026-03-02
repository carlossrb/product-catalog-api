import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateProductDto {
  @ApiProperty({ example: "Camiseta Básica", maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  readonly name!: string;

  @ApiPropertyOptional({ example: "Camiseta de algodão 100%" })
  @IsString()
  @IsOptional()
  readonly description?: string;
}
