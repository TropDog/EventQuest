import configuration from './configuration';
import { validateConfiguration, ConfigurationError } from './validate-configuration';

describe('validateConfiguration', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('allows placeholder payments when NODE_ENV is explicitly development', () => {
    process.env.NODE_ENV = 'development';

    expect(() =>
      validateConfiguration({
        ...configuration(),
        payments: {
          ...configuration().payments,
          provider: 'placeholder',
        },
      }),
    ).not.toThrow();
  });

  it('allows placeholder payments when NODE_ENV is explicitly test', () => {
    process.env.NODE_ENV = 'test';

    expect(() =>
      validateConfiguration({
        ...configuration(),
        payments: {
          ...configuration().payments,
          provider: 'placeholder',
        },
      }),
    ).not.toThrow();
  });

  it('rejects placeholder payments in production', () => {
    process.env.NODE_ENV = 'production';

    expect(() =>
      validateConfiguration({
        ...configuration(),
        nodeEnv: 'production',
        payments: {
          ...configuration().payments,
          provider: 'placeholder',
        },
      }),
    ).toThrow(ConfigurationError);
  });

  it('rejects placeholder payments when NODE_ENV is omitted', () => {
    delete process.env.NODE_ENV;

    expect(() =>
      validateConfiguration({
        ...configuration(),
        payments: {
          ...configuration().payments,
          provider: 'placeholder',
        },
      }),
    ).toThrow(ConfigurationError);
  });

  it('rejects placeholder payments for unrecognized environments', () => {
    process.env.NODE_ENV = 'staging';

    expect(() =>
      validateConfiguration({
        ...configuration(),
        nodeEnv: 'staging',
        payments: {
          ...configuration().payments,
          provider: 'placeholder',
        },
      }),
    ).toThrow(ConfigurationError);
  });

  it('allows stripe payments in production', () => {
    process.env.NODE_ENV = 'production';

    expect(() =>
      validateConfiguration({
        ...configuration(),
        nodeEnv: 'production',
        payments: {
          ...configuration().payments,
          provider: 'stripe',
        },
      }),
    ).not.toThrow();
  });
});
