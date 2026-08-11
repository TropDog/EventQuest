import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PackagesModule } from '../packages/packages.module';
import { AuthModule } from '../auth/auth.module';
import { PlaceholderPaymentProvider } from './placeholder-payment.provider';
import { StripePaymentProvider } from './stripe-payment.provider';
import { paymentProviderFactory } from './payment-provider.factory';

@Module({
  imports: [PackagesModule, AuthModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PlaceholderPaymentProvider,
    StripePaymentProvider,
    paymentProviderFactory,
  ],
})
export class PaymentsModule {}
