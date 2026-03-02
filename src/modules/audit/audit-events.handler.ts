import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AuditableEvent } from '../../common/interfaces/auditable-event.interface';
import { AuditService } from './audit.service';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductActivatedEvent,
  ProductArchivedEvent,
  CategoryAddedToProductEvent,
  CategoryRemovedFromProductEvent,
  AttributeAddedEvent,
  AttributeUpdatedEvent,
  AttributeRemovedEvent,
} from '../products/events/product.events';
import {
  CategoryCreatedEvent,
  CategoryUpdatedEvent,
} from '../categories/events/category.events';

@EventsHandler(
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductActivatedEvent,
  ProductArchivedEvent,
  CategoryAddedToProductEvent,
  CategoryRemovedFromProductEvent,
  AttributeAddedEvent,
  AttributeUpdatedEvent,
  AttributeRemovedEvent,
  CategoryCreatedEvent,
  CategoryUpdatedEvent,
)
export class AuditEventsHandler implements IEventHandler<AuditableEvent> {
  constructor(private readonly auditService: AuditService) {}

  async handle(event: AuditableEvent): Promise<void> {
    await this.auditService.log(event.toAuditPayload());
  }
}
