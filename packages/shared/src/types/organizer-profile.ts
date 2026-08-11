/**
 * Public organizer identity returned by auth endpoints.
 * Must not include password hashes or token hashes.
 */
export interface OrganizerProfile {
  id: string;
  email: string;
  termsAcceptedAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  organizer: OrganizerProfile;
  accessToken: string;
  refreshToken: string;
}
