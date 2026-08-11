/**
 * Event status lifecycle.
 * @see docs/DOMAIN_MODEL.md §4
 */
export enum EventStatus {
  DRAFT = 'DRAFT',
  CONFIGURED = 'CONFIGURED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}
