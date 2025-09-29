import { PrismaClient } from '@prisma/client';

/**
 * Global reference to store the Prisma client instance in development.
 * This prevents multiple client instantiations during hot reloads in Next.js.
 */
const globalForPrisma = globalThis;

/**
 * Creates or retrieves the Prisma client instance.
 * In production, a new instance is created for each request.
 * In development, a global instance is reused to avoid connection issues.
 * @returns {PrismaClient} The Prisma client instance.
 */
function createPrismaClient() {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Failed to create Prisma client:', error);
    throw error;
  }
}

/**
 * The Prisma client instance.
 * Uses singleton pattern in development for performance.
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  // In production, create a new client instance normally
  prisma = createPrismaClient();
} else {
  // In development, use the global instance to avoid multiple clients with Next.js hot reload
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

// Ensure the client disconnects gracefully on process exit
process.on('beforeExit', async () => {
  try {
    await prisma?.$disconnect();
  } catch (error) {
    console.error('Error disconnecting Prisma client:', error);
  }
});

export default prisma;
