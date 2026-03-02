import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateCategoryHandler } from '../commands/create-category.handler';
import { CreateCategoryCommand } from '../commands/create-category.command';
import { UpdateCategoryHandler } from '../commands/update-category.handler';
import { UpdateCategoryCommand } from '../commands/update-category.command';
import { GetCategoryHandler } from '../queries/get-category.handler';
import { GetCategoryQuery } from '../queries/get-category.query';
import { ListCategoriesHandler } from '../queries/list-categories.handler';
import { ListCategoriesQuery } from '../queries/list-categories.query';
import { Category } from '../entities/category.entity';

const mockRepository = () =>
  ({
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
  }) as unknown as Repository<Category>;

const mockEventBus = () => ({ publish: vi.fn() }) as unknown as EventBus;

const buildCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: 'cat-1',
    name: 'Vestuário',
    parentId: null,
    parent: null,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Category;

describe('CreateCategoryHandler', () => {
  const repo = mockRepository();
  const eventBus = mockEventBus();
  const handler = new CreateCategoryHandler(repo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve criar categoria sem pai', async () => {
    const saved = buildCategory();
    vi.mocked(repo.findOne).mockResolvedValue(null);
    vi.mocked(repo.create).mockReturnValue(saved);
    vi.mocked(repo.save).mockResolvedValue(saved);

    const result = await handler.execute(
      new CreateCategoryCommand('Vestuário', null),
    );

    expect(result.name).toBe('Vestuário');
    expect(result.parentId).toBeNull();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve criar categoria com pai existente', async () => {
    const parent = buildCategory();
    const saved = buildCategory({
      id: 'cat-2',
      name: 'Camisetas',
      parentId: 'cat-1',
    });

    vi.mocked(repo.findOne)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(parent);
    vi.mocked(repo.create).mockReturnValue(saved);
    vi.mocked(repo.save).mockResolvedValue(saved);

    const result = await handler.execute(
      new CreateCategoryCommand('Camisetas', 'cat-1'),
    );

    expect(result.parentId).toBe('cat-1');
  });

  it('deve rejeitar nome duplicado', async () => {
    vi.mocked(repo.findOne).mockResolvedValue(buildCategory());

    await expect(
      handler.execute(new CreateCategoryCommand('Vestuário', null)),
    ).rejects.toThrow(ConflictException);
  });

  it('deve rejeitar quando pai não existe', async () => {
    vi.mocked(repo.findOne)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(
      handler.execute(new CreateCategoryCommand('Camisetas', 'inexistente')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('UpdateCategoryHandler', () => {
  const repo = mockRepository();
  const eventBus = mockEventBus();
  const handler = new UpdateCategoryHandler(repo, eventBus);

  beforeEach(() => vi.clearAllMocks());

  it('deve atualizar nome da categoria', async () => {
    const category = buildCategory();
    vi.mocked(repo.findOne)
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce(null);
    vi.mocked(repo.save).mockResolvedValue({
      ...category,
      name: 'Moda',
    } as Category);

    await handler.execute(new UpdateCategoryCommand('cat-1', 'Moda'));

    expect(repo.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('deve atualizar parentId', async () => {
    const category = buildCategory();
    const parent = buildCategory({ id: 'cat-parent', name: 'Root' });

    vi.mocked(repo.findOne)
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce(parent);
    vi.mocked(repo.save).mockResolvedValue(category);

    await handler.execute(
      new UpdateCategoryCommand('cat-1', undefined, 'cat-parent'),
    );

    expect(repo.save).toHaveBeenCalled();
  });

  it('deve permitir remover parentId (null)', async () => {
    const category = buildCategory({ parentId: 'cat-parent' });
    vi.mocked(repo.findOne).mockResolvedValueOnce(category);
    vi.mocked(repo.save).mockResolvedValue(category);

    await handler.execute(
      new UpdateCategoryCommand('cat-1', undefined, null),
    );

    expect(repo.save).toHaveBeenCalled();
  });

  it('deve rejeitar auto-referência como pai', async () => {
    const category = buildCategory();
    vi.mocked(repo.findOne).mockResolvedValueOnce(category);

    await expect(
      handler.execute(new UpdateCategoryCommand('cat-1', undefined, 'cat-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar nome duplicado', async () => {
    const category = buildCategory();
    const duplicate = buildCategory({ id: 'cat-2', name: 'Moda' });

    vi.mocked(repo.findOne)
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce(duplicate);

    await expect(
      handler.execute(new UpdateCategoryCommand('cat-1', 'Moda')),
    ).rejects.toThrow(ConflictException);
  });

  it('deve rejeitar quando pai não existe', async () => {
    const category = buildCategory();
    vi.mocked(repo.findOne)
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce(null);

    await expect(
      handler.execute(
        new UpdateCategoryCommand('cat-1', undefined, 'inexistente'),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar NotFoundException quando categoria não existe', async () => {
    vi.mocked(repo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateCategoryCommand('inexistente', 'Nome')),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve retornar categoria sem salvar quando não há alterações', async () => {
    const category = buildCategory();
    vi.mocked(repo.findOne).mockResolvedValueOnce(category);

    const result = await handler.execute(new UpdateCategoryCommand('cat-1'));

    expect(result).toBe(category);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

describe('GetCategoryHandler', () => {
  const repo = mockRepository();
  const handler = new GetCategoryHandler(repo);

  beforeEach(() => vi.clearAllMocks());

  it('deve retornar categoria com parent e children', async () => {
    const category = buildCategory();
    vi.mocked(repo.findOne).mockResolvedValue(category);

    const result = await handler.execute(new GetCategoryQuery('cat-1'));

    expect(result).toBe(category);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      relations: ['parent', 'children'],
    });
  });

  it('deve lançar NotFoundException quando não existe', async () => {
    vi.mocked(repo.findOne).mockResolvedValue(null);

    await expect(
      handler.execute(new GetCategoryQuery('inexistente')),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ListCategoriesHandler', () => {
  const repo = mockRepository();
  const handler = new ListCategoriesHandler(repo);

  beforeEach(() => vi.clearAllMocks());

  it('deve retornar lista paginada com defaults', async () => {
    const categories = [buildCategory()];
    vi.mocked(repo.findAndCount).mockResolvedValue([categories, 1]);

    const result = await handler.execute(new ListCategoriesQuery());

    expect(result).toEqual({
      data: categories,
      total: 1,
      page: 1,
      limit: 20,
    });
  });

  it('deve filtrar por nome', async () => {
    vi.mocked(repo.findAndCount).mockResolvedValue([[], 0]);

    await handler.execute(
      new ListCategoriesQuery('vest', 'name', 'asc', 2, 10),
    );

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ name: expect.anything() }),
        skip: 10,
        take: 10,
      }),
    );
  });
});
