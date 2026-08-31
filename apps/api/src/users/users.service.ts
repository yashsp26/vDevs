import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import argon2 from 'argon2';

import { db } from '../prisma/db.js';
import type { CreateUserDto } from './create-user.dto.js';

@Injectable()
export class UsersService {
  async findAll() {
    return db.orm.public.User
      .select('id', 'email', 'username', 'name')
      .orderBy((user) => user.createdAt.desc())
      .all();
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await argon2.hash(dto.password);

    try {
      return await db.orm.public.User
        .select('id', 'email', 'username', 'name', 'createdAt', 'updatedAt')
        .create({
          email: dto.email,
          username: null,
          name: null,
          passwordHash,
          emailVerifiedAt: null,
        });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'sqlState' in error &&
        'constraint' in error &&
        error.sqlState === '23505' &&
        error.constraint === 'user_email_key'
      ) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }
}