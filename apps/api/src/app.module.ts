import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoordinatorModule } from './modules/coordinator/coordinator.module';
import { PlayersModule } from './modules/players/players.module';
import { PackagesModule } from './modules/packages/packages.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    CoordinatorModule,
    PlayersModule,
    PackagesModule,
    PaymentsModule,
    EventsModule,
  ],
})
export class AppModule {}
