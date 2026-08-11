import { Prisma } from '@prisma/client';

export function isRoomCodeUniqueViolation(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes('room_code');
  }

  if (typeof target === 'string') {
    return target.includes('room_code');
  }

  return false;
}
