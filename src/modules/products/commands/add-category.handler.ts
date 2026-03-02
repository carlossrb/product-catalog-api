import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddCategoryCommand } from './add-category.command';
import { Product } from '../entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductStatus } from '../entities/product-status.enum';
import { CategoryAddedToProductEvent } from '../events/product.events';

@CommandHandler(AddCategoryCommand)
export class AddCategoryHandler
  implements ICommandHandler<AddCategoryCommand>
{
  private readonly logger = new Logger(AddCategoryHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddCategoryCommand): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: command.productId },
      relations: ['categories'],
    });

    if (!product) {
      throw new NotFoundException(`Product ${command.productId} not found`);
    }

    if (product.status === ProductStatus.ARCHIVED) {
      throw new BadRequestException(
        'Cannot modify categories of an archived product',
      );
    }

    const category = await this.categoryRepository.findOne({
      where: { id: command.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category ${command.categoryId} not found`,
      );
    }

    const alreadyAssociated = product.categories.some(
      (c) => c.id === command.categoryId,
    );

    if (alreadyAssociated) {
      throw new ConflictException(
        'Category is already associated with this product',
      );
    }

    product.categories.push(category);
    const saved = await this.productRepository.save(product);

    this.logger.log(
      `Category ${category.id} added to product ${product.id}`,
    );
    this.eventBus.publish(
      new CategoryAddedToProductEvent(
        product.id,
        category.id,
        category.name,
      ),
    );

    return saved;
  }
}
