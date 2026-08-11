import { OrganizerAccount } from '@prisma/client';
import type { OrganizerProfile } from '@eventquest/shared';

export function toOrganizerProfile(
  organizer: OrganizerAccount,
): OrganizerProfile {
  return {
    id: organizer.id,
    email: organizer.email,
    termsAcceptedAt: organizer.termsAcceptedAt.toISOString(),
    createdAt: organizer.createdAt.toISOString(),
  };
}
