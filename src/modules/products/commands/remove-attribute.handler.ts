import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemoveAttributeCommand } from './remove-attribute.command';
import { Product } from '../entities/product.entity';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { ProductStatus } from '../entities/product-status.enum';
import { AttributeRemovedEvent } from '../events/product.events';

@CommandHandler(RemoveAttributeCommand)
export class RemoveAttributeHandler
  implements ICommandHandler<RemoveAttributeCommand>
{
  private readonly logger = new Logger(RemoveAttributeHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAttribute)
    private readonly attributeRepository: Repository<ProductAttribute>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RemoveAttributeCommand): Promise<void> {
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

    await this.attributeRepository.remove(attribute);

    this.logger.log(
      `Attribute "${attribute.key}" removed from product ${product.id}`,
    );
    this.eventBus.publish(
      new AttributeRemovedEvent(product.id, command.attributeId, attribute.key),
    );
  }
}
