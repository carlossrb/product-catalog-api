import {
  AuditableEvent,
  AuditPayload,
} from '../../../common/interfaces/auditable-event.interface';

export class CategoryCreatedEvent implements AuditableEvent {
  constructor(
    public readonly categoryId: string,
    public readonly name: string,
    public readonly parentId: string | null,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: this.categoryId,
      payload: { name: this.name, parentId: this.parentId },
    };
  }
}

export class CategoryUpdatedEvent implements AuditableEvent {
  constructor(
    public readonly categoryId: string,
    public readonly changes: Record<string, unknown>,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: 'CATEGORY_UPDATED',
      entityType: 'Category',
      entityId: this.categoryId,
      payload: this.changes,
    };
  }
}
