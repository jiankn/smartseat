import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  g.prisma ??
  new PrismaClient({
    log: ['error', 'warn'] // 需要详细日志可改为 ['query','info','warn','error']
  });

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;

export default prisma;
