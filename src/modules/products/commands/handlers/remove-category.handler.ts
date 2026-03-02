import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { RemoveCategoryCommand } from "../impl/remove-category.command";
import { Product } from "../../entities/product.entity";
import { ProductStatus } from "../../entities/product-status.enum";
import { CategoryRemovedFromProductEvent } from "../../events/product.events";
import { CacheKeys } from "../../../../common/cache/cache-keys";

@CommandHandler(RemoveCategoryCommand)
export class RemoveCategoryHandler implements ICommandHandler<RemoveCategoryCommand> {
  private readonly logger = new Logger(RemoveCategoryHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventBus: EventBus,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async execute(command: RemoveCategoryCommand): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: command.productId },
      relations: ["categories"],
    });

    if (!product) {
      throw new NotFoundException(`Product ${command.productId} not found`);
    }

    if (product.status === ProductStatus.ARCHIVED) {
      throw new BadRequestException(
        "Cannot modify categories of an archived product",
      );
    }

    const categoryIndex = product.categories.findIndex(
      (c) => c.id === command.categoryId,
    );

    if (categoryIndex === -1) {
      throw new NotFoundException(
        `Category ${command.categoryId} is not associated with this product`,
      );
    }

    product.categories.splice(categoryIndex, 1);
    const saved = await this.productRepository.save(product);

    await this.cache.del(CacheKeys.product(product.id));

    this.logger.log(
      `Category ${command.categoryId} removed from product ${product.id}`,
    );
    this.eventBus.publish(
      new CategoryRemovedFromProductEvent(product.id, command.categoryId),
    );

    return saved;
  }
}
