import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Aha backend API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  // Set global prefix
  app.setGlobalPrefix(globalPrefix);

  // Start app
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
