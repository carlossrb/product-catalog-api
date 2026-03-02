import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditDto } from './dto/query-audit.dto';
import { ApiTagWithDescription } from '../../common/decorators/api-tag.decorator';

@Controller('audit')
@ApiTagWithDescription('Audit', 'Consulta de logs de auditoria')
export class AuditController {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @ApiResponse({ status: 200, description: 'Lista de audit logs' })
  async findAll(@Query() query: QueryAuditDto): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<AuditLog> = {};

    if (query.action) {
      where.action = ILike(`%${query.action}%`);
    }
    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.entityId) {
      where.entityId = query.entityId;
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
