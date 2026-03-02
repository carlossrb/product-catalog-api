import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { ActivateProductCommand } from "../impl/activate-product.command";
import { Product } from "../../entities/product.entity";
import { ProductStatus } from "../../entities/product-status.enum";
import { ProductActivatedEvent } from "../../events/product.events";

@CommandHandler(ActivateProductCommand)
export class ActivateProductHandler implements ICommandHandler<ActivateProductCommand> {
  private readonly logger = new Logger(ActivateProductHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ActivateProductCommand): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: command.id },
      relations: ["categories", "attributes"],
    });

    if (!product) {
      throw new NotFoundException(`Product ${command.id} not found`);
    }

    if (product.status === ProductStatus.ARCHIVED) {
      throw new BadRequestException("Archived products cannot be activated");
    }

    if (product.status === ProductStatus.ACTIVE) {
      throw new BadRequestException("Product is already active");
    }

    const violations: string[] = [];

    if (product.categories.length === 0) {
      violations.push("Product must have at least 1 category");
    }

    if (product.attributes.length === 0) {
      violations.push("Product must have at least 1 attribute");
    }

    const duplicate = await this.productRepository.findOne({
      where: { name: product.name, id: Not(product.id) },
    });

    if (duplicate) {
      violations.push(
        `Another product with the name "${product.name}" already exists`,
      );
    }

    if (violations.length) {
      throw new BadRequestException({
        message: "Product cannot be activated",
        violations,
      });
    }

    product.status = ProductStatus.ACTIVE;
    const saved = await this.productRepository.save(product);

    this.logger.log(`Product activated: ${saved.id} - ${saved.name}`);
    this.eventBus.publish(new ProductActivatedEvent(saved.id, saved.name));

    return saved;
  }
}
