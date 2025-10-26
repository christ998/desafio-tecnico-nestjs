import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('GitHub Metrics API')
    .setDescription(
      'Microservicio para calcular métricas de perfiles de GitHub con arquitectura hexagonal',
    )
    .setVersion('1.0')
    .addTag('health', 'Endpoints de salud del sistema')
    .addTag('users', 'Información de perfiles de GitHub')
    .addTag('metrics', 'Métricas calculadas de usuarios')
    .addServer('http://localhost:3000', 'Servidor de desarrollo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'GitHub Metrics API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`
╔═══════════════════════════════════════════════════════════
║ Application started successfully!
╠═══════════════════════════════════════════════════════════
║ URL: http://localhost:${port}
║ Swagger Docs: http://localhost:${port}/api/docs
║ Profiles: http://localhost:${port}/profiles/:username
║ Metrics: http://localhost:${port}/metrics/:username
╚═══════════════════════════════════════════════════════════
  `);
}
bootstrap();
