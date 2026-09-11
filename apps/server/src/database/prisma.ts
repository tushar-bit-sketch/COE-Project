import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}
