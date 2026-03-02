import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateAttributeCommand } from './update-attribute.command';
import { Product } from '../entities/product.entity';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { ProductStatus } from '../entities/product-status.enum';
import { AttributeUpdatedEvent } from '../events/product.events';

@CommandHandler(UpdateAttributeCommand)
export class UpdateAttributeHandler
  implements ICommandHandler<UpdateAttributeCommand>
{
  private readonly logger = new Logger(UpdateAttributeHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAttribute)
    private readonly attributeRepository: Repository<ProductAttribute>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateAttributeCommand): Promise<ProductAttribute> {
    const product = await this.productRepository.findOne({
      where: { id: command.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${command.productId} not found`);
    }

    if (product.status === ProductStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot modify attributes of an archived product',
      );
    }

    const attribute = await this.attributeRepository.findOne({
      where: { id: command.attributeId, productId: command.productId },
    });

    if (!attribute) {
      throw new NotFoundException(
        `Attribute ${command.attributeId} not found for product ${command.productId}`,
      );
    }

    const changes: Record<string, unknown> = {};

    if (command.key !== undefined) {
      changes.key = command.key;
      attribute.key = command.key;
    }

    if (command.value !== undefined) {
      changes.value = command.value;
      attribute.value = command.value;
    }

    if (Object.keys(changes).length === 0) {
      return attribute;
    }

    const saved = await this.attributeRepository.save(attribute);

    this.logger.log(`Attribute ${attribute.id} updated on product ${product.id}`);
    this.eventBus.publish(
      new AttributeUpdatedEvent(product.id, attribute.id, changes),
    );

    return saved;
  }
}
