import { applyDecorators } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

interface TagDescription {
  readonly name: string;
  readonly description: string;
}

const tagRegistry: TagDescription[] = [];

export function ApiTagWithDescription(
  name: string,
  description: string,
): ClassDecorator {
  tagRegistry.push({ name, description });
  return applyDecorators(ApiTags(name));
}

export function getTagDescriptions(): ReadonlyArray<TagDescription> {
  return tagRegistry;
}
