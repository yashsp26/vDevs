import { describe, expect, it } from 'vitest';
import { db } from '../src/prisma/db';

describe('User ORM', () => {
  it('can query users', async () => {
    const users = await db.orm.public.User
      .select('id', 'email', 'username', 'name')
      .limit(10)
      .all();

    expect(Array.isArray(users)).toBe(true);

    console.log(users);
  });
});