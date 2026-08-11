export type TeamsAccessContext =
  | { type: 'public' }
  | { type: 'organizer'; organizerId: string }
  | { type: 'coordinator'; eventId: string }
  | { type: 'player'; eventId: string; playerId: string };
