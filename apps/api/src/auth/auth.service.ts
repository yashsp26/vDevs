import { Injectable, UnauthorizedException } from '@nestjs/common';
import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

import { db } from '../prisma/db.js';
import type { LoginDto } from './login.dto.js';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  async login(dto: LoginDto) {
    const user = await db.orm.public.User.where((user) =>
      user.email.eq(dto.email),
    )
      .select(
        'id',
        'email',
        'username',
        'name',
        'passwordHash',
        'emailVerifiedAt',
      )
      .first();

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionToken = randomBytes(32).toString('base64url');

    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.orm.public.Session.create({
      userId: user.id,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      lastUsedAt: null,
    });

    return {
      sessionToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  }
  async getCurrentUser(sessionToken: string) {
    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

    const session = await db.orm.public.Session.where((session) =>
      session.tokenHash.eq(tokenHash),
    )
      .select('id', 'userId', 'expiresAt')
      .first();

    if (!session || new Date(session.expiresAt) <= new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await db.orm.public.User.where((user) =>
      user.id.eq(session.userId),
    )
      .select('id', 'email', 'username', 'name', 'emailVerifiedAt')
      .first();

    if (!user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return user;
  }

  async logout(sessionToken: string | undefined) {
    if (!sessionToken) {
      return;
    }

    const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

    await db.orm.public.Session.where((session) =>
      session.tokenHash.eq(tokenHash),
    ).delete();
  }
}
