import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateProductHandler } from '../commands/create-product.handler';
import { CreateProductCommand } from '../commands/create-product.command';
import { UpdateProductHandler } from '../commands/update-product.handler';
import { UpdateProductCommand } from '../commands/update-product.command';
import { ActivateProductHandler } from '../commands/activate-product.handler';
import { ActivateProductCommand } from '../commands/activate-product.command';
import { ArchiveProductHandler } from '../commands/archive-product.handler';
import { ArchiveProductCommand } from '../commands/archive-product.command';
import { AddCategoryHandler } from '../commands/add-category.handler';
import { AddCategoryCommand } from '../commands/add-category.command';
import { RemoveCategoryHandler } from '../commands/remove-category.handler';
import { RemoveCategoryCommand } from '../commands/remove-category.command';
import { AddAttributeHandler } from '../commands/add-attribute.handler';
import { AddAttributeCommand } from '../commands/add-attribute.command';
import { UpdateAttributeHandler } from '../commands/update-attribute.handler';
import { UpdateAttributeCommand } from '../commands/update-attribute.command';
import { RemoveAttributeHandler } from '../commands/remove-attribute.handler';
import { RemoveAttributeCommand } from '../commands/remove-attribute.command';
import { Product } from '../entities/product.entity';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { ProductStatus } from '../entities/product-status.enum';
import { Category } from '../../categories/entities/category.entity';

const mockRepository = <T>() =>
  ({
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    remove: vi.fn(),
  }) as unknown as Repository<T>;

const mockEventBus = () => ({ publish: vi.fn() }) as unknown as EventBus;

const buildProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'prod-1',
    name: 'Camiseta',
    description: null,
    status: ProductStatus.DRAFT,
    categories: [],
    attributes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Product;

const buildCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: 'cat-1',
    name: 'Vestuário',
    parentId: null,
    ...overrides,
  }) as Category;

const buildAttribute = (
  overrides: Partial<ProductAttribute> = {},
): ProductAttribute =>
  ({
    id: 'attr-1',
    key: 'cor',
    value: 'azul',
    productId: 'prod-1',
    ...overrides,
  }) as ProductAttribute;

describe('CreateProductHandler', () => {
  const productRepo = mockRepository<Product>();
  const eventBus = mockEventBus();
  const handler = new CreateProductHandler(productRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve criar produto com status DRAFT', async () => {
    const saved = buildProduct();
    vi.mocked(productRepo.create).mockReturnValue(saved);
    vi.mocked(productRepo.save).mockResolvedValue(saved);

    const result = await handler.execute(
      new CreateProductCommand('Camiseta', null),
    );

    expect(result.status).toBe(ProductStatus.DRAFT);
    expect(productRepo.create).toHaveBeenCalledWith({
      name: 'Camiseta',
      description: null,
    });
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve criar produto com descrição', async () => {
    const saved = buildProduct({ description: 'Algodão 100%' });
    vi.mocked(productRepo.create).mockReturnValue(saved);
    vi.mocked(productRepo.save).mockResolvedValue(saved);

    const result = await handler.execute(
      new CreateProductCommand('Camiseta', 'Algodão 100%'),
    );

    expect(result.description).toBe('Algodão 100%');
  });
});

describe('UpdateProductHandler', () => {
  const productRepo = mockRepository<Product>();
  const eventBus = mockEventBus();
  const handler = new UpdateProductHandler(productRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar nome e descrição de produto DRAFT', async () => {
    const product = buildProduct();
    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(productRepo.save).mockResolvedValue({
      ...product,
      name: 'Premium',
      description: 'Nova',
    } as Product);

    await handler.execute(new UpdateProductCommand('prod-1', 'Premium', 'Nova'));

    expect(productRepo.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve permitir atualizar apenas descrição de produto ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(productRepo.save).mockResolvedValue({
      ...product,
      description: 'Atualizada',
    } as Product);

    await handler.execute(
      new UpdateProductCommand('prod-1', undefined, 'Atualizada'),
    );

    expect(productRepo.save).toHaveBeenCalled();
  });

  it('deve rejeitar alteração de nome em produto ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new UpdateProductCommand('prod-1', 'Novo Nome')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve lançar NotFoundException quando produto não existe', async () => {
    vi.mocked(productRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateProductCommand('inexistente', 'Nome')),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve retornar produto sem salvar quando não há alterações', async () => {
    const product = buildProduct();
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    const result = await handler.execute(new UpdateProductCommand('prod-1'));

    expect(result).toBe(product);
    expect(productRepo.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});

describe('ActivateProductHandler', () => {
  const productRepo = mockRepository<Product>();
  const eventBus = mockEventBus();
  const handler = new ActivateProductHandler(productRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve ativar produto DRAFT com categorias e atributos', async () => {
    const product = buildProduct({
      categories: [buildCategory()],
      attributes: [buildAttribute()],
    });

    vi.mocked(productRepo.findOne)
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(null);
    vi.mocked(productRepo.save).mockResolvedValue({
      ...product,
      status: ProductStatus.ACTIVE,
    } as Product);

    const result = await handler.execute(new ActivateProductCommand('prod-1'));

    expect(result.status).toBe(ProductStatus.ACTIVE);
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve rejeitar ativação de produto ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new ActivateProductCommand('prod-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar ativação de produto já ACTIVE', async () => {
    const product = buildProduct({ status: ProductStatus.ACTIVE });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new ActivateProductCommand('prod-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando não tem categorias', async () => {
    const product = buildProduct({
      categories: [],
      attributes: [buildAttribute()],
    });

    vi.mocked(productRepo.findOne)
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(null);

    await expect(
      handler.execute(new ActivateProductCommand('prod-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando não tem atributos', async () => {
    const product = buildProduct({
      categories: [buildCategory()],
      attributes: [],
    });

    vi.mocked(productRepo.findOne)
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(null);

    await expect(
      handler.execute(new ActivateProductCommand('prod-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando existe outro produto com mesmo nome', async () => {
    const product = buildProduct({
      categories: [buildCategory()],
      attributes: [buildAttribute()],
    });
    const duplicate = buildProduct({ id: 'prod-2' });

    vi.mocked(productRepo.findOne)
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(duplicate);

    await expect(
      handler.execute(new ActivateProductCommand('prod-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve reportar múltiplas violações de uma vez', async () => {
    const product = buildProduct({ categories: [], attributes: [] });
    const duplicate = buildProduct({ id: 'prod-2' });

    vi.mocked(productRepo.findOne)
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(duplicate);

    try {
      await handler.execute(new ActivateProductCommand('prod-1'));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        violations: string[];
      };
      expect(response.violations).toHaveLength(3);
    }
  });

  it('deve lançar NotFoundException quando produto não existe', async () => {
    vi.mocked(productRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new ActivateProductCommand('inexistente')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ArchiveProductHandler', () => {
  const productRepo = mockRepository<Product>();
  const eventBus = mockEventBus();
  const handler = new ArchiveProductHandler(productRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve arquivar produto DRAFT', async () => {
    const product = buildProduct();
    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(productRepo.save).mockResolvedValue({
      ...product,
      status: ProductStatus.ARCHIVED,
    } as Product);

    const result = await handler.execute(new ArchiveProductCommand('prod-1'));

    expect(result.status).toBe(ProductStatus.ARCHIVED);
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve arquivar produto ACTIVE', async () => {
    const product = buildProduct({ status: ProductStatus.ACTIVE });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(productRepo.save).mockResolvedValue({
      ...product,
      status: ProductStatus.ARCHIVED,
    } as Product);

    const result = await handler.execute(new ArchiveProductCommand('prod-1'));

    expect(result.status).toBe(ProductStatus.ARCHIVED);
  });

  it('deve rejeitar produto já ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new ArchiveProductCommand('prod-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve lançar NotFoundException quando produto não existe', async () => {
    vi.mocked(productRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new ArchiveProductCommand('inexistente')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('AddCategoryHandler', () => {
  const productRepo = mockRepository<Product>();
  const categoryRepo = mockRepository<Category>();
  const eventBus = mockEventBus();
  const handler = new AddCategoryHandler(productRepo, categoryRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve associar categoria ao produto', async () => {
    const product = buildProduct();
    const category = buildCategory();

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(categoryRepo.findOne).mockResolvedValue(category);
    vi.mocked(productRepo.save).mockResolvedValue(product);

    await handler.execute(new AddCategoryCommand('prod-1', 'cat-1'));

    expect(productRepo.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve rejeitar quando produto é ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new AddCategoryCommand('prod-1', 'cat-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando produto não existe', async () => {
    vi.mocked(productRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new AddCategoryCommand('inexistente', 'cat-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve rejeitar quando categoria não existe', async () => {
    const product = buildProduct();
    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(categoryRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new AddCategoryCommand('prod-1', 'inexistente')),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve rejeitar quando categoria já está associada', async () => {
    const category = buildCategory();
    const product = buildProduct({ categories: [category] });

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(categoryRepo.findOne).mockResolvedValue(category);

    await expect(
      handler.execute(new AddCategoryCommand('prod-1', 'cat-1')),
    ).rejects.toThrow(ConflictException);
  });
});

describe('RemoveCategoryHandler', () => {
  const productRepo = mockRepository<Product>();
  const eventBus = mockEventBus();
  const handler = new RemoveCategoryHandler(productRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve remover categoria do produto', async () => {
    const category = buildCategory();
    const product = buildProduct({ categories: [category] });

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(productRepo.save).mockResolvedValue(product);

    await handler.execute(new RemoveCategoryCommand('prod-1', 'cat-1'));

    expect(productRepo.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve rejeitar quando produto é ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new RemoveCategoryCommand('prod-1', 'cat-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando categoria não está associada', async () => {
    const product = buildProduct();
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new RemoveCategoryCommand('prod-1', 'cat-x')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('AddAttributeHandler', () => {
  const productRepo = mockRepository<Product>();
  const attrRepo = mockRepository<ProductAttribute>();
  const eventBus = mockEventBus();
  const handler = new AddAttributeHandler(productRepo, attrRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve adicionar atributo ao produto', async () => {
    const product = buildProduct();
    const saved = buildAttribute();

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(null);
    vi.mocked(attrRepo.create).mockReturnValue(saved);
    vi.mocked(attrRepo.save).mockResolvedValue(saved);

    const result = await handler.execute(
      new AddAttributeCommand('prod-1', 'cor', 'azul'),
    );

    expect(result.key).toBe('cor');
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve rejeitar quando produto é ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new AddAttributeCommand('prod-1', 'cor', 'azul')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando key já existe no produto', async () => {
    const product = buildProduct();
    const existing = buildAttribute();

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(existing);

    await expect(
      handler.execute(new AddAttributeCommand('prod-1', 'cor', 'verde')),
    ).rejects.toThrow(ConflictException);
  });

  it('deve rejeitar quando produto não existe', async () => {
    vi.mocked(productRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new AddAttributeCommand('inexistente', 'cor', 'azul')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('UpdateAttributeHandler', () => {
  const productRepo = mockRepository<Product>();
  const attrRepo = mockRepository<ProductAttribute>();
  const eventBus = mockEventBus();
  const handler = new UpdateAttributeHandler(productRepo, attrRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar valor do atributo', async () => {
    const product = buildProduct();
    const attr = buildAttribute();

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(attr);
    vi.mocked(attrRepo.save).mockResolvedValue({ ...attr, value: 'verde' } as ProductAttribute);

    const result = await handler.execute(
      new UpdateAttributeCommand('prod-1', 'attr-1', undefined, 'verde'),
    );

    expect(attrRepo.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve atualizar key e value do atributo', async () => {
    const product = buildProduct();
    const attr = buildAttribute();

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(attr);
    vi.mocked(attrRepo.save).mockResolvedValue({
      ...attr,
      key: 'tamanho',
      value: 'M',
    } as ProductAttribute);

    await handler.execute(
      new UpdateAttributeCommand('prod-1', 'attr-1', 'tamanho', 'M'),
    );

    expect(attrRepo.save).toHaveBeenCalled();
  });

  it('deve retornar atributo sem salvar quando não há alterações', async () => {
    const product = buildProduct();
    const attr = buildAttribute();

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(attr);

    const result = await handler.execute(
      new UpdateAttributeCommand('prod-1', 'attr-1'),
    );

    expect(result).toBe(attr);
    expect(attrRepo.save).not.toHaveBeenCalled();
  });

  it('deve rejeitar quando produto é ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(
        new UpdateAttributeCommand('prod-1', 'attr-1', undefined, 'x'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando atributo não existe', async () => {
    const product = buildProduct();
    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateAttributeCommand('prod-1', 'inexistente', undefined, 'x'),
      ),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('RemoveAttributeHandler', () => {
  const productRepo = mockRepository<Product>();
  const attrRepo = mockRepository<ProductAttribute>();
  const eventBus = mockEventBus();
  const handler = new RemoveAttributeHandler(productRepo, attrRepo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve remover atributo do produto', async () => {
    const product = buildProduct();
    const attr = buildAttribute();

    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(attr);
    vi.mocked(attrRepo.remove).mockResolvedValue(attr);

    await handler.execute(new RemoveAttributeCommand('prod-1', 'attr-1'));

    expect(attrRepo.remove).toHaveBeenCalledWith(attr);
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve rejeitar quando produto é ARCHIVED', async () => {
    const product = buildProduct({ status: ProductStatus.ARCHIVED });
    vi.mocked(productRepo.findOne).mockResolvedValue(product);

    await expect(
      handler.execute(new RemoveAttributeCommand('prod-1', 'attr-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar quando atributo não existe', async () => {
    const product = buildProduct();
    vi.mocked(productRepo.findOne).mockResolvedValue(product);
    vi.mocked(attrRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new RemoveAttributeCommand('prod-1', 'inexistente')),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve rejeitar quando produto não existe', async () => {
    vi.mocked(productRepo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new RemoveAttributeCommand('inexistente', 'attr-1')),
    ).rejects.toThrow(NotFoundException);
  });
});
