import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginRequestSchema } from '@sentinel/shared';
import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = LoginRequestSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username and password are required',
        details: parseResult.error.format(),
      },
    });
    return;
  }

  const { username, password } = parseResult.data;

  // Query user from database
  let user = await prisma.user.findUnique({
    where: { username },
  });

  // If user does not exist in DB yet (e.g. before initial seed ran), check default hardcoded demo credentials
  if (!user && username === 'admin' && password === 'sentinel2025') {
    const passwordHash = await bcrypt.hash('sentinel2025', 10);
    user = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'ADMIN',
        clearance: 'ALPHA-7',
      },
    });
  }

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Invalid operator identification or clearance code',
      },
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Invalid operator identification or clearance code',
      },
    });
    return;
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Record audit event
  await prisma.systemEvent.create({
    data: {
      type: 'AUTH',
      message: `Operator ${user.username} authenticated with clearance ${user.clearance}`,
      severity: 'OK',
      source: 'AUTH_CONTROLLER',
    },
  });

  // Sign JWT
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      clearance: user.clearance,
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        clearance: user.clearance,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: { message: 'Operator session terminated successfully' },
  });
}

export async function getSession(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No active session found' },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      role: true,
      clearance: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User record no longer exists' },
    });
    return;
  }

  res.json({
    success: true,
    data: { user },
  });
}
