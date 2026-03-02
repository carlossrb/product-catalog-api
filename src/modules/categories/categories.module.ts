import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesController } from './categories.controller';
import { CategoryCommandHandlers } from './commands';
import { CategoryQueryHandlers } from './queries';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [...CategoryCommandHandlers, ...CategoryQueryHandlers],
})
export class CategoriesModule {}
