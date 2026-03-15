import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join, isAbsolute } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const bodyLimit = process.env.BODY_LIMIT || '10mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  // Configs globais
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const uploadPath = process.env.UPLOAD_PATH || './uploads/photos';
  const uploadAbsolutePath = isAbsolute(uploadPath)
    ? uploadPath
    : join(process.cwd(), uploadPath);
  app.useStaticAssets(uploadAbsolutePath, { prefix: '/uploads/photos' });

  // Swagger (habilite/ajuste como preferir)
  const config = new DocumentBuilder()
    .setTitle('Primata Estética API')
    .setDescription('Documentação da API do sistema Primata Estética')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer', // nome do security scheme
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Primata Estética — API Docs',
  });

  await app.listen(3000);
}

bootstrap();
