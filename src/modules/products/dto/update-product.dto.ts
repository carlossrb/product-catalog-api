import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProductDto {
  @ApiPropertyOptional({ example: "Camiseta Premium" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly name?: string;

  @ApiPropertyOptional({ example: "Camiseta de algodão egípcio" })
  @IsString()
  @IsOptional()
  readonly description?: string;
}
