import { ProductStatus } from "../../entities/product-status.enum";

export class ListProductsQuery {
  constructor(
    public readonly name?: string,
    public readonly status?: ProductStatus,
    public readonly sortBy: "createdAt" | "updatedAt" | "name" = "createdAt",
    public readonly sortOrder: "asc" | "desc" = "desc",
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
