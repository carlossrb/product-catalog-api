export class ListCategoriesQuery {
  constructor(
    public readonly name?: string,
    public readonly sortBy: "createdAt" | "name" = "createdAt",
    public readonly sortOrder: "asc" | "desc" = "desc",
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {}
}
