import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters';
import { Request, Response } from 'express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        rawBody: true,
    });

    const configService = app.get(ConfigService);

    const nodeEnv = configService.get('NODE_ENV');
    const frontendUrl = configService.get('FRONTEND_URL');
    if (!nodeEnv || !frontendUrl)
        throw new InternalServerErrorException('ENV NOT SET');

    app.set('trust proxy', true);

    const expressApp = app.getHttpAdapter().getInstance();

    expressApp.get('/', (req: Request, res: Response) => {
        res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    app.use(helmet());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            disableErrorMessages: false,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.enableCors({
        origin:
            process.env.NODE_ENV === 'production'
                ? process.env.FRONTEND_URL
                : true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    const config = new DocumentBuilder()
        .setTitle('Riti Backend Docs')
        .setDescription('The Riti API documentation w/ OpenAPI')
        .setVersion('1.0')
        .addTag('Riti')
        .build();

    const docFactory = () => SwaggerModule.createDocument(app, config);

    if (process.env.NODE_ENV !== 'production') {
        SwaggerModule.setup('docs', app, docFactory);
    }

    app.setGlobalPrefix('api');

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
