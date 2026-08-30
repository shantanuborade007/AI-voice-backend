import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PhoneNumbersModule } from './phone-numbers/phone-numbers.module';
import { SarvamModule } from './ai/sarvam.module';
import { TelephonyModule } from './telephony/telephony.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'smb_voice_platform'),
        autoLoadEntities: true,
        // Schema is managed by the plain SQL files in db/migrations (see db/DB_README.txt).
        synchronize: false,
      }),
    }),
    AuthModule,
    UsersModule,
    BusinessesModule,
    SubscriptionsModule,
    PhoneNumbersModule,
    SarvamModule,
    TelephonyModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
