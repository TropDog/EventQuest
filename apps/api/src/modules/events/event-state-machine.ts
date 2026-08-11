import { EventStatus } from '@eventquest/shared';

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.CONFIGURED],
  [EventStatus.CONFIGURED]: [EventStatus.ACTIVE],
  [EventStatus.ACTIVE]: [EventStatus.CLOSED],
  [EventStatus.CLOSED]: [EventStatus.ARCHIVED],
  [EventStatus.ARCHIVED]: [],
};

export function canTransition(
  from: EventStatus,
  to: EventStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransitionAllowed(
  from: EventStatus,
  to: EventStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid event status transition: ${from} → ${to}`);
  }
}

export const EDITABLE_EVENT_STATUSES: EventStatus[] = [
  EventStatus.DRAFT,
  EventStatus.CONFIGURED,
];

export function isEventEditable(status: EventStatus): boolean {
  return EDITABLE_EVENT_STATUSES.includes(status);
}
