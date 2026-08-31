import { db } from '../prisma/db';

const users = await db.orm.public.User
  .select('id', 'email', 'username', 'name')
  .limit(10)
  .all();

console.log(users);