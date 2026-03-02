import { CreateCategoryHandler } from "./handlers/create-category.handler";
import { UpdateCategoryHandler } from "./handlers/update-category.handler";

export const CategoryCommandHandlers = [
  CreateCategoryHandler,
  UpdateCategoryHandler,
];
