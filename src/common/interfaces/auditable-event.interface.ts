export interface AuditPayload {
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly payload: Record<string, unknown>;
}

export interface AuditableEvent {
  toAuditPayload(): AuditPayload;
}
