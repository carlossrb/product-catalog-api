import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ApiTagWithDescription } from "../../common/decorators/api-tag.decorator";
import { HealthService } from "./health.service";

@Controller("health")
@ApiTagWithDescription("Health", "Verificação de saúde da aplicação")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Health check da aplicação" })
  @ApiResponse({ status: 200, description: "Aplicação saudável" })
  async check() {
    return this.healthService.check();
  }
}
