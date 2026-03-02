export class AddCategoryCommand {
  constructor(
    public readonly productId: string,
    public readonly categoryId: string,
  ) {}
}
