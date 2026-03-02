import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { AuditPayload } from "../../common/interfaces/auditable-event.interface";

export const AUDIT_QUEUE = "audit";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectQueue(AUDIT_QUEUE) private readonly auditQueue: Queue) {}

  async log(payload: AuditPayload): Promise<void> {
    await this.auditQueue.add("audit-log", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });

    this.logger.debug(
      `Audit event enqueued: ${payload.action} on ${payload.entityType}:${payload.entityId}`,
    );
  }
}
