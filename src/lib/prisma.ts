
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

neonConfig.webSocketConstructor = ws
neonConfig.poolQueryViaFetch = true

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  neonPool: Pool | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured')
  }

  const pool =
    globalForPrisma.neonPool ??
    new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
    })

  if (!globalForPrisma.neonPool) {
    pool.on('error', (error) => {
      console.error('Neon connection pool error:', error.message)
    })

    globalForPrisma.neonPool = pool
  }

  const adapter = new PrismaNeon(pool)

  return new PrismaClient({
    adapter,
  } as any)
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma
