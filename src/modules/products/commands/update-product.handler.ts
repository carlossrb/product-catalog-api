import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProductCommand } from './update-product.command';
import { Product } from '../entities/product.entity';
import { ProductStatus } from '../entities/product-status.enum';
import { ProductUpdatedEvent } from '../events/product.events';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler
  implements ICommandHandler<UpdateProductCommand>
{
  private readonly logger = new Logger(UpdateProductHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: command.id },
    });

    if (!product) {
      throw new NotFoundException(`Product ${command.id} not found`);
    }

    if (product.status === ProductStatus.ARCHIVED) {
      if (command.name !== undefined) {
        throw new BadRequestException(
          'Archived products can only have their description updated',
        );
      }
    }

    const changes: Record<string, unknown> = {};

    if (command.name !== undefined) {
      changes.name = command.name;
      product.name = command.name;
    }

    if (command.description !== undefined) {
      changes.description = command.description;
      product.description = command.description;
    }

    if (Object.keys(changes).length === 0) {
      return product;
    }

    const saved = await this.productRepository.save(product);

    this.logger.log(`Product updated: ${saved.id}`);
    this.eventBus.publish(new ProductUpdatedEvent(saved.id, changes));

    return saved;
  }
}
