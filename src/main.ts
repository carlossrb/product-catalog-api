import { NestFactory, Reflector } from "@nestjs/core";
import { ClassSerializerInterceptor, ValidationPipe } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import { transports, format } from "winston";
import { AppModule } from "./app.module";
import { setupDocs } from "./config/docs.config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new transports.Console({
          level: process.env.NODE_ENV === "production" ? "warn" : "debug",
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
    }),
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization",
  });

  setupDocs(app);

  const port = Number(process.env.APP_PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
