import { CreateProductHandler } from './create-product.handler';
import { UpdateProductHandler } from './update-product.handler';
import { ActivateProductHandler } from './activate-product.handler';
import { ArchiveProductHandler } from './archive-product.handler';
import { AddCategoryHandler } from './add-category.handler';
import { RemoveCategoryHandler } from './remove-category.handler';
import { AddAttributeHandler } from './add-attribute.handler';
import { UpdateAttributeHandler } from './update-attribute.handler';
import { RemoveAttributeHandler } from './remove-attribute.handler';

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
