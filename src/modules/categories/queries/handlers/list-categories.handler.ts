import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { ListCategoriesQuery } from "../impl/list-categories.query";
import { Category } from "../../entities/category.entity";
import {
  CacheKeys,
  CacheTTL,
  hashQueryParams,
} from "../../../../common/cache/cache-keys";

interface PaginatedResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async execute(
    query: ListCategoriesQuery,
  ): Promise<PaginatedResult<Category>> {
    const version =
      (await this.cache.get<number>(CacheKeys.categoryListVersion())) ?? 0;
    const hash = hashQueryParams({
      name: query.name,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    });
    const cacheKey = CacheKeys.categoryList(version, hash);
    const cached = await this.cache.get<PaginatedResult<Category>>(cacheKey);

    if (cached) {
      return cached;
    }

    const skip = (query.page - 1) * query.limit;

    const where: FindOptionsWhere<Category> = {};

    if (query.name) {
      where.name = ILike(`%${query.name}%`);
    }

    const [data, total] = await this.categoryRepository.findAndCount({
      where,
      relations: ["parent"],
      order: { [query.sortBy]: query.sortOrder.toUpperCase() },
      skip,
      take: query.limit,
    });

    const result: PaginatedResult<Category> = {
      data,
      total,
      page: query.page,
      limit: query.limit,
    };

    await this.cache.set(cacheKey, result, CacheTTL.CATEGORY_LIST);

    return result;
  }
}
