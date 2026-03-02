import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductCommand } from './create-product.command';
import { Product } from '../entities/product.entity';
import { ProductCreatedEvent } from '../events/product.events';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler
  implements ICommandHandler<CreateProductCommand>
{
  private readonly logger = new Logger(CreateProductHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    const product = this.productRepository.create({
      name: command.name,
      description: command.description,
    });

    const saved = await this.productRepository.save(product);

    this.logger.log(`Product created: ${saved.id} - ${saved.name}`);
    this.eventBus.publish(new ProductCreatedEvent(saved.id, saved.name));

    return saved;
  }
}
