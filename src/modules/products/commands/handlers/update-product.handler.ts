import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { UpdateProductCommand } from "../impl/update-product.command";
import { Product } from "../../entities/product.entity";
import { ProductStatus } from "../../entities/product-status.enum";
import { ProductUpdatedEvent } from "../../events/product.events";
import { CacheKeys } from "../../../../common/cache/cache-keys";

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  private readonly logger = new Logger(UpdateProductHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventBus: EventBus,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
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
          "Archived products can only have their description updated",
        );
      }
    }

    const changes: Record<string, unknown> = {};

    if (command.name) {
      changes.name = command.name;
      product.name = command.name;
    }

    if (command.description) {
      changes.description = command.description;
      product.description = command.description;
    }

    if (!Object.keys(changes).length) {
      return product;
    }

    const saved = await this.productRepository.save(product);

    await this.cache.del(CacheKeys.product(saved.id));

    this.logger.log(`Product updated: ${saved.id}`);
    this.eventBus.publish(new ProductUpdatedEvent(saved.id, changes));

    return saved;
  }
}
