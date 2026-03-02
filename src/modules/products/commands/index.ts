import { CreateProductHandler } from "./handlers/create-product.handler";
import { UpdateProductHandler } from "./handlers/update-product.handler";
import { ActivateProductHandler } from "./handlers/activate-product.handler";
import { ArchiveProductHandler } from "./handlers/archive-product.handler";
import { AddCategoryHandler } from "./handlers/add-category.handler";
import { RemoveCategoryHandler } from "./handlers/remove-category.handler";
import { AddAttributeHandler } from "./handlers/add-attribute.handler";
import { UpdateAttributeHandler } from "./handlers/update-attribute.handler";
import { RemoveAttributeHandler } from "./handlers/remove-attribute.handler";

export const ProductCommandHandlers = [
  CreateProductHandler,
  UpdateProductHandler,
  ActivateProductHandler,
  ArchiveProductHandler,
  AddCategoryHandler,
  RemoveCategoryHandler,
  AddAttributeHandler,
  UpdateAttributeHandler,
  RemoveAttributeHandler,
];
