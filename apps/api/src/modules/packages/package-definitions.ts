import type { PackageDefinition } from '@eventquest/shared';

/**
 * Central package configuration aligned with docs/PRD.md tier limits.
 * Participant limits must be read from here, not hardcoded elsewhere.
 *
 * Package prices are not defined in source documentation; only FREE is
 * configured with priceCents=0. Paid tiers remain unavailable for checkout
 * until product pricing is defined.
 */
export const PACKAGE_DEFINITIONS: PackageDefinition[] = [
  {
    type: 'FREE',
    name: 'Free',
    description: 'Birthdays, house parties, and small family events (up to 20 participants).',
    participantLimit: 20,
    priceCents: 0,
    currency: 'PLN',
  },
  {
    type: 'BASIC',
    name: 'Basic',
    description: 'Small weddings and events (up to 60 participants).',
    participantLimit: 60,
    priceCents: null,
    currency: 'PLN',
  },
  {
    type: 'PREMIUM',
    name: 'Premium',
    description: 'Standard weddings and larger parties (up to 100 participants).',
    participantLimit: 100,
    priceCents: null,
    currency: 'PLN',
  },
  {
    type: 'UNLIMITED',
    name: 'Unlimited',
    description: 'Very large events with no participant limit.',
    participantLimit: null,
    priceCents: null,
    currency: 'PLN',
  },
];

export function findPackageDefinition(
  packageType: string,
): PackageDefinition | undefined {
  return PACKAGE_DEFINITIONS.find(
    (definition) => definition.type === packageType,
  );
}

export function isCheckoutAvailable(definition: PackageDefinition): boolean {
  return definition.priceCents !== null;
}
