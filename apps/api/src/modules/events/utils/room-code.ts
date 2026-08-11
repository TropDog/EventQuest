const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const MAX_GENERATION_ATTEMPTS = 10;

export function generateRoomCode(): string {
  let code = '';

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[randomIndex];
  }

  return code;
}

export function buildJoinUrl(frontendBaseUrl: string, roomCode: string): string {
  const normalizedBaseUrl = frontendBaseUrl.replace(/\/+$/, '');
  return `${normalizedBaseUrl}/join/${encodeURIComponent(roomCode)}`;
}

export { MAX_GENERATION_ATTEMPTS, ROOM_CODE_LENGTH };
