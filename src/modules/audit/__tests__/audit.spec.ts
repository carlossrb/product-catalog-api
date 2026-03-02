import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Repository } from 'typeorm';
import { Queue, Job } from 'bullmq';
import { AuditService } from '../audit.service';
import { AuditProcessor } from '../audit.processor';
import { AuditEventsHandler } from '../audit-events.handler';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditPayload } from '../../../common/interfaces/auditable-event.interface';
import { ProductCreatedEvent } from '../../products/events/product.events';
import { CategoryCreatedEvent } from '../../categories/events/category.events';

const mockQueue = () =>
  ({ add: vi.fn().mockResolvedValue(undefined) }) as unknown as Queue;

const mockAuditLogRepository = () =>
  ({
    create: vi.fn(),
    save: vi.fn(),
  }) as unknown as Repository<AuditLog>;

describe('AuditService', () => {
  const queue = mockQueue();
  const service = new AuditService(queue);

  beforeEach(() => vi.clearAllMocks());

  it('deve enfileirar payload de auditoria no BullMQ', async () => {
    const payload: AuditPayload = {
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: 'prod-1',
      payload: { name: 'Camiseta' },
    };

    await service.log(payload);

    expect(queue.add).toHaveBeenCalledWith('audit-log', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  });
});

describe('AuditProcessor', () => {
  const repo = mockAuditLogRepository();
  const processor = new AuditProcessor(repo);

  beforeEach(() => vi.clearAllMocks());

  it('deve persistir audit log a partir do job', async () => {
    const payload: AuditPayload = {
      action: 'PRODUCT_ACTIVATED',
      entityType: 'Product',
      entityId: 'prod-1',
      payload: { name: 'Camiseta' },
    };

    const auditLog = { id: 'log-1', ...payload } as unknown as AuditLog;
    vi.mocked(repo.create).mockReturnValue(auditLog);
    vi.mocked(repo.save).mockResolvedValue(auditLog);

    await processor.process({ data: payload } as Job<AuditPayload>);

    expect(repo.create).toHaveBeenCalledWith({
      action: 'PRODUCT_ACTIVATED',
      entityType: 'Product',
      entityId: 'prod-1',
      payload: { name: 'Camiseta' },
    });
    expect(repo.save).toHaveBeenCalledWith(auditLog);
  });
});

describe('AuditEventsHandler', () => {
  const auditService = { log: vi.fn().mockResolvedValue(undefined) };
  const handler = new AuditEventsHandler(
    auditService as unknown as AuditService,
  );

  beforeEach(() => vi.clearAllMocks());

  it('deve delegar evento de produto para AuditService', async () => {
    const event = new ProductCreatedEvent('prod-1', 'Camiseta');

    await handler.handle(event);

    expect(auditService.log).toHaveBeenCalledWith({
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: 'prod-1',
      payload: { name: 'Camiseta' },
    });
  });

  it('deve delegar evento de categoria para AuditService', async () => {
    const event = new CategoryCreatedEvent('cat-1', 'Vestuário', null);

    await handler.handle(event);

    expect(auditService.log).toHaveBeenCalledWith({
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: 'cat-1',
      payload: { name: 'Vestuário', parentId: null },
    });
  });
});
