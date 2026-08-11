import { Prisma } from '@prisma/client';
import { isRoomCodeUniqueViolation } from './prisma-errors';

describe('isRoomCodeUniqueViolation', () => {
  it('detects room_code unique constraint violations', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['room_code'] },
      },
    );

    expect(isRoomCodeUniqueViolation(error)).toBe(true);
  });

  it('ignores other unique constraint violations', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['package_purchase_id'] },
      },
    );

    expect(isRoomCodeUniqueViolation(error)).toBe(false);
  });
});
