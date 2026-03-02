import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { GetCategoryQuery } from "../impl/get-category.query";
import { Category } from "../../entities/category.entity";
import { CacheKeys, CacheTTL } from "../../../../common/cache/cache-keys";

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async execute(query: GetCategoryQuery): Promise<Category> {
    const cacheKey = CacheKeys.category(query.id);
    const cached = await this.cache.get<Category>(cacheKey);

    if (cached) {
      return cached;
    }

    const category = await this.categoryRepository.findOne({
      where: { id: query.id },
      relations: ["parent", "children"],
    });

    if (!category) {
      throw new NotFoundException(`Category ${query.id} not found`);
    }

    await this.cache.set(cacheKey, category, CacheTTL.CATEGORY_DETAIL);

    return category;
  }
}
