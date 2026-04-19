import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: dev ? ['warn', 'error'] : ['error']
	});

if (dev) globalForPrisma.prisma = prisma;

export default prisma;
