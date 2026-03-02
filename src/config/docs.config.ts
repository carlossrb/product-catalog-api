import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { getTagDescriptions } from '../common/decorators/api-tag.decorator';

export function setupDocs(app: INestApplication): void {
  const configBuilder = new DocumentBuilder()
    .setTitle('Product Catalog API')
    .setDescription(
      'API REST para gerenciamento de catálogo de produtos. ' +
        'Suporta criação, ativação e arquivamento de produtos, ' +
        'categorias hierárquicas, atributos dinâmicos e auditoria assíncrona.',
    )
    .setVersion('1.0.0')
    .addServer(
      `http://localhost:${process.env.APP_PORT ?? 3000}`,
      'Local server',
    );

  const tagDescriptions = getTagDescriptions();
  for (const { name, description } of tagDescriptions) {
    configBuilder.addTag(name, description);
  }

  const config = configBuilder.build();
  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/docs',
    apiReference({
      content: document,
      theme: 'elysiajs',
    }),
  );
}
