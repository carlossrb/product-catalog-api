import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ArchiveProductCommand } from "../impl/archive-product.command";
import { Product } from "../../entities/product.entity";
import { ProductStatus } from "../../entities/product-status.enum";
import { ProductArchivedEvent } from "../../events/product.events";

@CommandHandler(ArchiveProductCommand)
export class ArchiveProductHandler implements ICommandHandler<ArchiveProductCommand> {
  private readonly logger = new Logger(ArchiveProductHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ArchiveProductCommand): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: command.id },
    });

    if (!product) {
      throw new NotFoundException(`Product ${command.id} not found`);
    }

    if (product.status === ProductStatus.ARCHIVED) {
      throw new BadRequestException("Product is already archived");
    }

    product.status = ProductStatus.ARCHIVED;
    const saved = await this.productRepository.save(product);

    this.logger.log(`Product archived: ${saved.id} - ${saved.name}`);
    this.eventBus.publish(new ProductArchivedEvent(saved.id, saved.name));

    return saved;
  }
}
