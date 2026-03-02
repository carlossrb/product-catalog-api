export class RemoveAttributeCommand {
  constructor(
    public readonly productId: string,
    public readonly attributeId: string,
  ) {}
}
