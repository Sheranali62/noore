
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured')
  }

  const adapter = new PrismaNeon({ connectionString })

  return new PrismaClient({
    adapter,
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma
