import { canTransition, isEventEditable } from './event-state-machine';
import { EventStatus } from '@eventquest/shared';

describe('event-state-machine', () => {
  it('allows documented lifecycle transitions', () => {
    expect(canTransition(EventStatus.DRAFT, EventStatus.CONFIGURED)).toBe(true);
    expect(canTransition(EventStatus.CONFIGURED, EventStatus.ACTIVE)).toBe(true);
    expect(canTransition(EventStatus.ACTIVE, EventStatus.CLOSED)).toBe(true);
    expect(canTransition(EventStatus.CLOSED, EventStatus.ARCHIVED)).toBe(true);
  });

  it('rejects invalid lifecycle transitions', () => {
    expect(canTransition(EventStatus.DRAFT, EventStatus.ACTIVE)).toBe(false);
    expect(canTransition(EventStatus.ACTIVE, EventStatus.CONFIGURED)).toBe(false);
    expect(canTransition(EventStatus.CLOSED, EventStatus.ACTIVE)).toBe(false);
  });

  it('allows editing only before activation', () => {
    expect(isEventEditable(EventStatus.DRAFT)).toBe(true);
    expect(isEventEditable(EventStatus.CONFIGURED)).toBe(true);
    expect(isEventEditable(EventStatus.ACTIVE)).toBe(false);
  });
});
