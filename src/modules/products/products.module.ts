import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { ProductAttribute } from "./entities/product-attribute.entity";
import { Category } from "../categories/entities/category.entity";
import { ProductsController } from "./products.controller";
import { ProductCommandHandlers } from "./commands";
import { ProductQueryHandlers } from "./queries";

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Product, ProductAttribute, Category]),
  ],
  controllers: [ProductsController],
  providers: [...ProductCommandHandlers, ...ProductQueryHandlers],
})
export class ProductsModule {}
