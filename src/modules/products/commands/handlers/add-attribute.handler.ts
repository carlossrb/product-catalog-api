import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AddAttributeCommand } from "../impl/add-attribute.command";
import { Product } from "../../entities/product.entity";
import { ProductAttribute } from "../../entities/product-attribute.entity";
import { ProductStatus } from "../../entities/product-status.enum";
import { AttributeAddedEvent } from "../../events/product.events";

@CommandHandler(AddAttributeCommand)
export class AddAttributeHandler implements ICommandHandler<AddAttributeCommand> {
  private readonly logger = new Logger(AddAttributeHandler.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAttribute)
    private readonly attributeRepository: Repository<ProductAttribute>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddAttributeCommand): Promise<ProductAttribute> {
    const product = await this.productRepository.findOne({
      where: { id: command.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${command.productId} not found`);
    }

    if (product.status === ProductStatus.ARCHIVED) {
      throw new BadRequestException(
        "Cannot modify attributes of an archived product",
      );
    }

    const existing = await this.attributeRepository.findOne({
      where: { productId: command.productId, key: command.key },
    });

    if (existing) {
      throw new ConflictException(
        `Attribute with key "${command.key}" already exists for this product`,
      );
    }

    const attribute = this.attributeRepository.create({
      productId: command.productId,
      key: command.key,
      value: command.value,
    });

    const saved = await this.attributeRepository.save(attribute);

    this.logger.log(
      `Attribute "${command.key}" added to product ${product.id}`,
    );
    this.eventBus.publish(
      new AttributeAddedEvent(product.id, command.key, command.value),
    );

    return saved;
  }
}
