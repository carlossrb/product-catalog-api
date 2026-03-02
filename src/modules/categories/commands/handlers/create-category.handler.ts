import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { ConflictException, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { CreateCategoryCommand } from "../impl/create-category.command";
import { Category } from "../../entities/category.entity";
import { CategoryCreatedEvent } from "../../events/category.events";
import { CacheKeys } from "../../../../common/cache/cache-keys";

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  private readonly logger = new Logger(CreateCategoryHandler.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly eventBus: EventBus,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: command.name },
    });

    if (existing) {
      throw new ConflictException(
        `Category with name "${command.name}" already exists`,
      );
    }

    if (command.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: command.parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent category ${command.parentId} not found`,
        );
      }
    }

    const category = this.categoryRepository.create({
      name: command.name,
      parentId: command.parentId,
    });

    const saved = await this.categoryRepository.save(category);

    const currentVersion =
      (await this.cache.get<number>(CacheKeys.categoryListVersion())) ?? 0;
    await this.cache.set(CacheKeys.categoryListVersion(), currentVersion + 1);

    this.logger.log(`Category created: ${saved.id} - ${saved.name}`);
    this.eventBus.publish(
      new CategoryCreatedEvent(saved.id, saved.name, saved.parentId),
    );

    return saved;
  }
}
