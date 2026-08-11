import type { AppConfiguration } from './configuration';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const PLACEHOLDER_ALLOWED_NODE_ENVS = new Set(['development', 'test']);

export function validateConfiguration(config: AppConfiguration): void {
  if (config.payments.provider !== 'placeholder') {
    return;
  }

  const explicitNodeEnv = process.env.NODE_ENV;

  if (
    !explicitNodeEnv ||
    !PLACEHOLDER_ALLOWED_NODE_ENVS.has(explicitNodeEnv)
  ) {
    throw new ConfigurationError(
      'PAYMENTS_PROVIDER=placeholder requires NODE_ENV to be explicitly development or test',
    );
  }
}
