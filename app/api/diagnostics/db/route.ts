import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import dns from "node:dns/promises"
import net from "node:net"
import tls from "node:tls"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getDatabaseInfo() {
  const url = process.env.DATABASE_URL

  if (!url) {
    return {
      configured: false,
      error: "DATABASE_URL is not configured",
    }
  }

  try {
    const parsed = new URL(url)

    return {
      configured: true,
      protocol: parsed.protocol,
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || "(empty)",
      sslmode: parsed.searchParams.get("sslmode") || "(not specified)",
    }
  } catch {
    return {
      configured: true,
      error: "DATABASE_URL exists but could not be parsed",
    }
  }
}

async function testDns(host: string) {
  try {
    const addresses = await dns.lookup(host, {
      all: true,
    })

    return {
      ok: true,
      addresses: addresses.map((x) => ({
        address: x.address,
        family: x.family,
      })),
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function testTcp(host: string, port: number) {
  return new Promise<{
    ok: boolean
    error?: string
    address?: string
  }>((resolve) => {
    const socket = new net.Socket()

    const timeout = setTimeout(() => {
      socket.destroy()
      resolve({
        ok: false,
        error: "TCP connection timed out after 5000ms",
      })
    }, 5000)

    socket.once("connect", () => {
      clearTimeout(timeout)

      const address = socket.remoteAddress

      socket.destroy()

      resolve({
        ok: true,
        address,
      })
    })

    socket.once("error", (error) => {
      clearTimeout(timeout)

      socket.destroy()

      resolve({
        ok: false,
        error: error.message,
      })
    })

    socket.connect(port, host)
  })
}

async function testTls(host: string, port: number) {
  return new Promise<{
    ok: boolean
    authorized?: boolean
    protocol?: string
    cipher?: string
    remoteAddress?: string
    error?: string
  }>((resolve) => {
    const socket = tls.connect({
      host,
      port,
      servername: host,
      rejectUnauthorized: true,
    })

    const timeout = setTimeout(() => {
      socket.destroy()

      resolve({
        ok: false,
        error: "TLS connection timed out after 7000ms",
      })
    }, 7000)

    socket.once("secureConnect", () => {
      clearTimeout(timeout)

      const cipher = socket.getCipher()
      const remoteAddress = socket.remoteAddress

      const result = {
        ok: true,
        authorized: socket.authorized,
        protocol: socket.getProtocol() || undefined,
        cipher: cipher?.name,
        remoteAddress,
      }

      socket.destroy()

      resolve(result)
    })

    socket.once("error", (error) => {
      clearTimeout(timeout)

      socket.destroy()

      resolve({
        ok: false,
        error: error.message,
      })
    })
  })
}

async function testPrisma() {
  const prisma = new PrismaClient()

  try {
    await prisma.$connect()

    const productCount = await prisma.product.count()

    return {
      ok: true,
      productCount,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}

export async function GET() {
  const startedAt = Date.now()

  const database = getDatabaseInfo()

  if (!database.configured || !database.host) {
    return NextResponse.json(
      {
        ok: false,
        stage: "environment",
        database,
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    )
  }

  const host = database.host
  const port = Number(database.port || 5432)

  const dnsResult = await testDns(host)
  const tcpResult = await testTcp(host, port)
  const tlsResult = await testTls(host, port)
  const prismaResult = await testPrisma()

  const allOk =
    dnsResult.ok &&
    tcpResult.ok &&
    tlsResult.ok &&
    prismaResult.ok

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: new Date().toISOString(),

      database,

      dns: dnsResult,

      tcp: {
        host,
        port,
        ...tcpResult,
      },

      tls: tlsResult,

      prisma: prismaResult,

      durationMs: Date.now() - startedAt,
    },
    {
      status: allOk ? 200 : 503,
    }
  )
}