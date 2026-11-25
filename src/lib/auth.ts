import { getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import NextAuth from "next-auth"
import bcrypt from "bcryptjs"

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const emailInput = credentials.email.trim().toLowerCase()
      const authenticateLegacyPrismaUser = async () => {
        const legacyUser = await prisma.user.findUnique({
          where: { email: emailInput },
        })

        if (!legacyUser?.password) return null

        const passwordMatches = await bcrypt.compare(
          credentials.password,
          legacyUser.password
        )
        if (!passwordMatches) return null

        return {
          id: legacyUser.id,
          email: legacyUser.email,
          name: legacyUser.name,
          role: legacyUser.role,
        }
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        try {
          return await authenticateLegacyPrismaUser()
        } catch {
          console.error("Legacy credentials authentication failed")
          return null
        }
      }

      try {
        const authResponse = await fetch(
          `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              email: emailInput,
              password: credentials.password,
            }),
            cache: "no-store",
          }
        )

        if (!authResponse.ok) return await authenticateLegacyPrismaUser()

        const authResult = await authResponse.json()
        const email = authResult.user?.email?.toLowerCase()
        if (!email) return null

        const metadata = authResult.user.user_metadata ?? {}
        const name =
          metadata.full_name ?? metadata.name ?? metadata.display_name ?? null

        // SUPER_ADMIN_EMAIL is a one-time bootstrap rule for a newly created
        // application user. Existing database roles must never be silently
        // re-promoted on every login after an administrator changes them.
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
        const isConfiguredSuperAdmin = Boolean(superAdminEmail && email === superAdminEmail)

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            ...(name ? { name } : {}),
          },
          create: {
            email,
            name,
            password: null,
            role: isConfiguredSuperAdmin ? "SUPER_ADMIN" : "CUSTOMER",
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      } catch {
        // Do not log credentials, tokens, or provider response bodies.
        console.error("Credentials authentication failed")
        return null
      }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const userId = typeof token.id === "string" ? token.id : null

        if (!userId) {
          session.user.id = ""
          session.user.role = "CUSTOMER"
          return session
        }

        // Never authorize staff from a role claim that may have gone stale
        // inside a long-lived JWT. Re-read the canonical role for every
        // server-side session resolution; database errors fail closed.
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        })

        // A deleted account must no longer retain an authenticated identity.
        // Empty ID makes existing session guards reject the session.
        session.user.id = currentUser?.id ?? ""
        session.user.role = currentUser?.role ?? "CUSTOMER"
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    // Shorter session lifetime limits the exposure window for a stolen token.
    maxAge: 4 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

export const auth = () => getServerSession(authOptions)
