export class RemoveCategoryCommand {
  constructor(
    public readonly productId: string,
    public readonly categoryId: string,
  ) {}
}
