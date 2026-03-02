import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: "Moda Masculina" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  readonly name?: string;

  @ApiPropertyOptional({ example: "uuid-da-categoria-pai" })
  @IsUUID()
  @IsOptional()
  readonly parentId?: string | null;
}
