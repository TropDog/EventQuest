import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import configuration from './config/configuration';
import { validateConfiguration } from './config/validate-configuration';

async function bootstrap(): Promise<void> {
  validateConfiguration(configuration());

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3001);

  await app.listen(port);
}

bootstrap();
