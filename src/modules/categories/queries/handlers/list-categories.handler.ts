import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, ILike, Repository } from "typeorm";
import { ListCategoriesQuery } from "../impl/list-categories.query";
import { Category } from "../../entities/category.entity";

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
  ) {}

  async execute(
    query: ListCategoriesQuery,
  ): Promise<PaginatedResult<Category>> {
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

    return { data, total, page: query.page, limit: query.limit };
  }
}
