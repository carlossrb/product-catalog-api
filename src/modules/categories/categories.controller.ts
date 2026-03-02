import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiTagWithDescription } from '../../common/decorators/api-tag.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { CreateCategoryCommand } from './commands/create-category.command';
import { UpdateCategoryCommand } from './commands/update-category.command';
import { GetCategoryQuery } from './queries/get-category.query';
import { ListCategoriesQuery } from './queries/list-categories.query';
import { Category } from './entities/category.entity';

@Controller('categories')
@ApiTagWithDescription('Categories', 'Gerenciamento de categorias de produtos')
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada' })
  @ApiResponse({ status: 409, description: 'Nome já existe' })
  async create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.commandBus.execute(
      new CreateCategoryCommand(dto.name, dto.parentId ?? null),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome já existe' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.commandBus.execute(
      new UpdateCategoryCommand(id, dto.name, dto.parentId),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Category> {
    return this.queryBus.execute(new GetCategoryQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiResponse({ status: 200, description: 'Lista de categorias' })
  async findAll(@Query() query: QueryCategoriesDto) {
    return this.queryBus.execute(
      new ListCategoriesQuery(
        query.name,
        query.sortBy,
        query.sortOrder,
        query.page,
        query.limit,
      ),
    );
  }
}
