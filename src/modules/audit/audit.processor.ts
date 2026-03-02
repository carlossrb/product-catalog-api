import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "bullmq";
import { AuditLog } from "./entities/audit-log.entity";
import { AuditPayload } from "../../common/interfaces/auditable-event.interface";
import { AUDIT_QUEUE } from "./audit.service";

@Processor(AUDIT_QUEUE)
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {
    super();
  }

  async process(job: Job<AuditPayload>): Promise<void> {
    const { action, entityType, entityId, payload } = job.data;

    const auditLog = this.auditLogRepository.create({
      action,
      entityType,
      entityId,
      payload,
    });

    await this.auditLogRepository.save(auditLog);

    this.logger.log(
      `Audit log persisted: ${action} on ${entityType}:${entityId}`,
    );
  }
}
