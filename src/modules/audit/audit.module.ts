import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService, AUDIT_QUEUE } from './audit.service';
import { AuditProcessor } from './audit.processor';
import { AuditEventsHandler } from './audit-events.handler';
import { AuditController } from './audit.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    BullModule.registerQueue({ name: AUDIT_QUEUE }),
  ],
  controllers: [AuditController],
  providers: [AuditService, AuditProcessor, AuditEventsHandler],
  exports: [AuditService],
})
export class AuditModule {}
