# Product Catalog API

API REST para gerenciamento de catálogo de produtos, construída com NestJS, TypeORM, CQRS e BullMQ.

## Stack Técnica

| Tecnologia | Propósito |
|---|---|
| **NestJS 11** | Framework HTTP + DI container |
| **TypeORM** | ORM relacional para PostgreSQL |
| **PostgreSQL 17** | Banco de dados relacional |
| **@nestjs/cqrs** | Separação de Commands e Queries |
| **BullMQ + Redis** | Fila para auditoria assíncrona |
| **Winston** | Logs estruturados em JSON |
| **Scalar** | Documentação OpenAPI interativa |
| **Vitest** | Framework de testes |
| **Docker Compose** | Infraestrutura local |

---

## Como Rodar

### Pré-requisitos

- Node.js >= 24
- pnpm >= 10
- Docker e Docker Compose

### Com Docker Compose (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

A API estará disponível em `http://localhost:3000` e a documentação em `http://localhost:3000/docs`.

### Localmente (sem Docker para a API)

```bash
# Suba apenas PostgreSQL e Redis
docker compose up postgres redis -d

cp .env.example .env
pnpm install
pnpm start:dev
```

### Rodar Testes

```bash
pnpm test          # executa todos os testes
pnpm test:watch    # modo watch
```

---

## Variáveis de Ambiente

| Variável | Descrição | Default |
|---|---|---|
| `NODE_ENV` | Ambiente de execução | `development` |
| `APP_PORT` | Porta da aplicação | `3000` |
| `PG_HOST` | Host do PostgreSQL | `localhost` |
| `PG_PORT` | Porta do PostgreSQL | `5432` |
| `PG_USERNAME` | Usuário do PostgreSQL | `postgres` |
| `PG_PASSWORD` | Senha do PostgreSQL | `postgres` |
| `PG_DATABASE` | Nome do banco | `product_catalog` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |

---

## Endpoints

### Health

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check com status do banco |

### Products

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/products` | Criar produto (inicia como DRAFT) |
| `GET` | `/products` | Listar produtos (filtros, paginação) |
| `GET` | `/products/:id` | Buscar produto por ID |
| `PATCH` | `/products/:id` | Atualizar produto |
| `PATCH` | `/products/:id/activate` | Ativar produto (DRAFT → ACTIVE) |
| `PATCH` | `/products/:id/archive` | Arquivar produto |
| `POST` | `/products/:id/categories/:categoryId` | Associar categoria |
| `DELETE` | `/products/:id/categories/:categoryId` | Remover categoria |
| `POST` | `/products/:id/attributes` | Adicionar atributo |
| `PATCH` | `/products/:id/attributes/:attributeId` | Atualizar atributo |
| `DELETE` | `/products/:id/attributes/:attributeId` | Remover atributo |

### Categories

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/categories` | Criar categoria |
| `GET` | `/categories` | Listar categorias |
| `GET` | `/categories/:id` | Buscar categoria por ID |
| `PATCH` | `/categories/:id` | Atualizar categoria |

### Audit

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/audit` | Consultar logs de auditoria |

---

## Decisões Arquiteturais

### CQRS (`@nestjs/cqrs`)

Adotei CQRS para separar claramente as operações de escrita (Commands) das de leitura (Queries). Cada caso de uso tem seu próprio handler isolado, o que facilita:

- **Testabilidade**: cada handler é testável de forma unitária com mocks simples.
- **Single Responsibility**: um handler faz uma coisa e faz bem.
- **Extensibilidade**: adicionar um novo caso de uso é criar um Command + Handler, sem tocar em código existente.
- **Eventos de domínio**: os handlers publicam eventos via `EventBus`, que são consumidos pelo módulo de auditoria de forma desacoplada.

**Trade-off**: mais arquivos que um service monolítico. Para este domínio com regras de negócio claras (status transitions, validações de ativação), a separação compensa pela clareza.

### TypeORM

Escolhido por ser requisito do desafio. Configurado com `autoLoadEntities: true` e `synchronize: true` em desenvolvimento para agilidade. Em produção, o ideal é usar migrations com `synchronize: false`.

A modelagem usa:
- **Product** ↔ **Category**: ManyToMany via join table `product_categories`
- **Product** → **ProductAttribute**: OneToMany com cascade
- **Category** → **Category**: auto-referência para hierarquia (parentId)
- **AuditLog**: entidade independente, populada assincronamente

### BullMQ + Redis (Mensageria)

**Por que BullMQ em vez de RabbitMQ, Kafka ou SQS?**

- **Pragmatismo**: Redis já faz parte da infraestrutura para a fila. Não adiciona um novo serviço ao docker-compose.
- **Suporte nativo no NestJS**: `@nestjs/bullmq` é o módulo oficial para filas, com integração madura.
- **Retry automático**: BullMQ oferece retry com backoff exponencial, dead-letter queue e rate limiting out-of-the-box.
- **Complexidade proporcional**: para auditoria assíncrona (poucos milhares de eventos/minuto), BullMQ é mais que suficiente. Kafka seria over-engineering para esse volume.

**Trade-off**: Redis não é um broker de mensageria "real" — não tem garantias de entrega tão fortes quanto RabbitMQ/Kafka. Para auditoria interna, onde uma eventual perda de log não é catastrófica (e o retry já mitiga isso), é aceitável.

**Fluxo de auditoria:**

```
CommandHandler → EventBus.publish(DomainEvent)
                         ↓
              AuditEventsHandler (CQRS)
                         ↓
              AuditService.log() → BullMQ Queue
                         ↓
              AuditProcessor (Worker) → Salva AuditLog no banco
```

Configuração do job: 3 tentativas com backoff exponencial (1s, 2s, 4s). Jobs completados são removidos após 1000 registros, falhos após 5000.

### Observabilidade (Logs Estruturados)

Winston configurado com output JSON em produção, permitindo ingestão em ferramentas como Datadog, ELK ou CloudWatch. Cada handler loga a ação executada com o ID da entidade afetada.

### Testes

- **Unitários**: cada command handler é testado isoladamente com mocks do Repository e EventBus. Cobrem regras de negócio (transitions de status, validações).
- **Foco**: validação das regras de domínio — produto só ativa com categorias e atributos, produto arquivado não aceita alteração de nome, nomes duplicados, etc.

### TypeScript Estrito

- `strict: true` no tsconfig (inclui `strictNullChecks`, `noImplicitAny`)
- `noUncheckedIndexedAccess: true` para segurança extra
- ESLint com `@typescript-eslint/no-explicit-any: error`
- Preferência por `const` sobre `let` em todo o codebase

---

## Regras de Negócio

### Produto

- Todo produto inicia com status **DRAFT**
- Transições válidas: `DRAFT → ACTIVE`, `DRAFT → ARCHIVED`, `ACTIVE → ARCHIVED`
- **Ativação** requer: ≥1 categoria, ≥1 atributo, nome único no sistema
- **Produto ARCHIVED**: não pode ser ativado nem ter categorias/atributos alterados. Apenas a descrição pode ser editada
- Atributos possuem key única por produto

### Categoria

- Nome único no sistema
- Suporta hierarquia simples via `parentId`
- Categoria não pode ser pai de si mesma
- `parentId`, se informado, deve referenciar categoria existente
