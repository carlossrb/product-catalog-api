import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UpdateCategoryCommand } from './update-category.command';
import { Category } from '../entities/category.entity';
import { CategoryUpdatedEvent } from '../events/category.events';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler
  implements ICommandHandler<UpdateCategoryCommand>
{
  private readonly logger = new Logger(UpdateCategoryHandler.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: command.id },
    });

    if (!category) {
      throw new NotFoundException(`Category ${command.id} not found`);
    }

    const changes: Record<string, unknown> = {};

    if (command.name !== undefined && command.name !== category.name) {
      const duplicate = await this.categoryRepository.findOne({
        where: { name: command.name, id: Not(command.id) },
      });

      if (duplicate) {
        throw new ConflictException(
          `Category with name "${command.name}" already exists`,
        );
      }

      changes.name = command.name;
      category.name = command.name;
    }

    if (command.parentId !== undefined) {
      if (command.parentId === command.id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      if (command.parentId !== null) {
        const parent = await this.categoryRepository.findOne({
          where: { id: command.parentId },
        });

        if (!parent) {
          throw new NotFoundException(
            `Parent category ${command.parentId} not found`,
          );
        }
      }

      changes.parentId = command.parentId;
      category.parentId = command.parentId;
    }

    if (Object.keys(changes).length === 0) {
      return category;
    }

    const saved = await this.categoryRepository.save(category);

    this.logger.log(`Category updated: ${saved.id}`);
    this.eventBus.publish(new CategoryUpdatedEvent(saved.id, changes));

    return saved;
  }
}
