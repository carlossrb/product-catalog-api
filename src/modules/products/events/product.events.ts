import {
  AuditableEvent,
  AuditPayload,
} from "../../../common/interfaces/auditable-event.interface";

export class ProductCreatedEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly name: string,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: this.productId,
      payload: { name: this.name },
    };
  }
}

export class ProductUpdatedEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly changes: Record<string, unknown>,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: this.productId,
      payload: this.changes,
    };
  }
}

export class ProductActivatedEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly name: string,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "PRODUCT_ACTIVATED",
      entityType: "Product",
      entityId: this.productId,
      payload: { name: this.name },
    };
  }
}

export class ProductArchivedEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly name: string,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "PRODUCT_ARCHIVED",
      entityType: "Product",
      entityId: this.productId,
      payload: { name: this.name },
    };
  }
}

export class CategoryAddedToProductEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly categoryId: string,
    public readonly categoryName: string,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "CATEGORY_ADDED_TO_PRODUCT",
      entityType: "Product",
      entityId: this.productId,
      payload: {
        categoryId: this.categoryId,
        categoryName: this.categoryName,
      },
    };
  }
}

export class CategoryRemovedFromProductEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly categoryId: string,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "CATEGORY_REMOVED_FROM_PRODUCT",
      entityType: "Product",
      entityId: this.productId,
      payload: { categoryId: this.categoryId },
    };
  }
}

export class AttributeAddedEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly key: string,
    public readonly value: string,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "ATTRIBUTE_ADDED",
      entityType: "Product",
      entityId: this.productId,
      payload: { key: this.key, value: this.value },
    };
  }
}

export class AttributeUpdatedEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly attributeId: string,
    public readonly changes: Record<string, unknown>,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "ATTRIBUTE_UPDATED",
      entityType: "Product",
      entityId: this.productId,
      payload: { attributeId: this.attributeId, ...this.changes },
    };
  }
}

export class AttributeRemovedEvent implements AuditableEvent {
  constructor(
    public readonly productId: string,
    public readonly attributeId: string,
    public readonly key: string,
  ) {}

  toAuditPayload(): AuditPayload {
    return {
      action: "ATTRIBUTE_REMOVED",
      entityType: "Product",
      entityId: this.productId,
      payload: { attributeId: this.attributeId, key: this.key },
    };
  }
}
