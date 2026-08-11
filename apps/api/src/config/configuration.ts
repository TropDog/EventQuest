import { PackageDefinition } from '@eventquest/shared';

export interface AppConfiguration {
  port: number;
  nodeEnv: string;
  databaseUrl: string | undefined;
  jwt: {
    accessSecret: string | undefined;
    accessExpiresIn: string;
    refreshExpiresInDays: number;
  };
  coordinator: {
    accessExpiresInDays: number;
  };
  payments: {
    provider: string;
    webhookSecret: string | undefined;
    stripeSecretKey: string | undefined;
    stripeWebhookSecret: string | undefined;
    checkoutSuccessUrl: string;
    checkoutCancelUrl: string;
  };
  app: {
    frontendBaseUrl: string;
    eventAutoCloseDays: number;
  };
}

export default (): AppConfiguration => ({
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresInDays: parseInt(
      process.env.JWT_REFRESH_EXPIRES_IN_DAYS ?? '7',
      10,
    ),
  },
  coordinator: {
    accessExpiresInDays: parseInt(
      process.env.COORDINATOR_ACCESS_EXPIRES_IN_DAYS ?? '30',
      10,
    ),
  },
  payments: {
    provider: process.env.PAYMENTS_PROVIDER ?? 'placeholder',
    webhookSecret: process.env.PAYMENTS_WEBHOOK_SECRET,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    checkoutSuccessUrl:
      process.env.PAYMENTS_CHECKOUT_SUCCESS_URL ??
      'http://localhost:3000/packages?checkout=success',
    checkoutCancelUrl:
      process.env.PAYMENTS_CHECKOUT_CANCEL_URL ??
      'http://localhost:3000/packages?checkout=cancelled',
  },
  app: {
    frontendBaseUrl:
      process.env.FRONTEND_BASE_URL ?? 'http://localhost:3000',
    eventAutoCloseDays: parseInt(
      process.env.EVENT_AUTO_CLOSE_DAYS ?? '7',
      10,
    ),
  },
});
