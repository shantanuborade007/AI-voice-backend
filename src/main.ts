import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { winstonLoggerOptions } from './common/logging/winston.config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOptions),
  });
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SMB Voice Platform API')
    .setDescription(
      'Backend for the SaaS platform that lets small business owners create a digital profile ' +
        '(name, hours, locations, catalog, FAQs), pick a subscription plan, and get a phone number ' +
        'that routes to an AI voice agent (Exotel for telephony, Sarvam AI for the voice agent) which ' +
        'can answer questions and book appointments.\n\n' +
        'All routes documented here are served under the `/api/v1` prefix. Authenticate with the ' +
        '`POST /api/v1/auth/login` or `POST /api/v1/auth/register` endpoint, then click "Authorize" ' +
        'and paste the returned `accessToken` as a Bearer token to call protected routes.',
    )
    .setVersion(packageJson.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token returned by /auth/login or /auth/register',
      },
      'access-token',
    )
    .addTag('Health', 'Service liveness check')
    .addTag('Auth', 'Business-owner signup and login (issues JWTs)')
    .addTag('Businesses', 'Business profile CRUD (owner or admin scoped)')
    .addTag('Locations', 'Branches/addresses with opening hours, nested under a business')
    .addTag('Catalog Items', 'Products/services/menu items, nested under a business')
    .addTag('FAQs', 'Question/answer knowledge base used by the future voice agent')
    .addTag('Availability', 'Recurring weekly availability slots used for appointment booking')
    .addTag('Appointments', 'Appointment bookings for a business')
    .addTag('Subscription Plans', 'Platform-wide subscription plan catalog')
    .addTag('Subscriptions', 'Per-business subscription selection and cancellation')
    .addTag('Phone Numbers', 'Exotel phone number assignment lifecycle per business')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('ai-voice/api-docs', app, swaggerDocument, {
    jsonDocumentUrl: 'ai-voice/api-docs-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });


  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  new Logger('Bootstrap').log(`Application listening on port ${port}`);
}

bootstrap();
