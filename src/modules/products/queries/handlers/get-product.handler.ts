import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { GetProductQuery } from "../impl/get-product.query";
import { Product } from "../../entities/product.entity";
import { CacheKeys, CacheTTL } from "../../../../common/cache/cache-keys";

@QueryHandler(GetProductQuery)
export class GetProductHandler implements IQueryHandler<GetProductQuery> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async execute(query: GetProductQuery): Promise<Product> {
    const cacheKey = CacheKeys.product(query.id);
    const cached = await this.cache.get<Product>(cacheKey);

    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findOne({
      where: { id: query.id },
      relations: ["categories", "attributes"],
    });

    if (!product) {
      throw new NotFoundException(`Product ${query.id} not found`);
    }

    await this.cache.set(cacheKey, product, CacheTTL.PRODUCT_DETAIL);

    return product;
  }
}
