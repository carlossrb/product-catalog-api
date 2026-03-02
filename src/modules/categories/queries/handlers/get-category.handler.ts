import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GetCategoryQuery } from "../impl/get-category.query";
import { Category } from "../../entities/category.entity";

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async execute(query: GetCategoryQuery): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: query.id },
      relations: ["parent", "children"],
    });

    if (!category) {
      throw new NotFoundException(`Category ${query.id} not found`);
    }

    return category;
  }
}
