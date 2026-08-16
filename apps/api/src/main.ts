import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import type { AppConfiguration } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfiguration>>(ConfigService);
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.getOrThrow('corsOrigins'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (config.getOrThrow('nodeEnv') !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('CashTracker API')
        .setDescription('REST API for CashTracker.')
        .setVersion('0.1.0')
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(config.getOrThrow('port'));
}

void bootstrap();
