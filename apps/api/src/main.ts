import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3001);

  await app.listen(port);
}

bootstrap();
