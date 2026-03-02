import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ListProductsQuery } from './list-products.query';
import { Product } from '../entities/product.entity';

interface PaginatedResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

@QueryHandler(ListProductsQuery)
export class ListProductsHandler
  implements IQueryHandler<ListProductsQuery>
{
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async execute(
    query: ListProductsQuery,
  ): Promise<PaginatedResult<Product>> {
    const skip = (query.page - 1) * query.limit;

    const where: FindOptionsWhere<Product> = {};

    if (query.name) {
      where.name = ILike(`%${query.name}%`);
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      relations: ['categories', 'attributes'],
      order: { [query.sortBy]: query.sortOrder.toUpperCase() },
      skip,
      take: query.limit,
    });

    return { data, total, page: query.page, limit: query.limit };
  }
}
