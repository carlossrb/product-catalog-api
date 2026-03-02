import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GetProductQuery } from "../impl/get-product.query";
import { Product } from "../../entities/product.entity";

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async execute(query: GetProductQuery): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: query.id },
      relations: ["categories", "attributes"],
    });

    if (!product) {
      throw new NotFoundException(`Product ${query.id} not found`);
    }

    return product;
  }
}
