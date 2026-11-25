import { getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import NextAuth from "next-auth"

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) return null

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
              email: credentials.email.trim().toLowerCase(),
              password: credentials.password,
            }),
            cache: "no-store",
          }
        )

        if (!authResponse.ok) return null

        const authResult = await authResponse.json()
        const email = authResult.user?.email?.toLowerCase()
        if (!email) return null

        const metadata = authResult.user.user_metadata ?? {}
        const name =
          metadata.full_name ?? metadata.name ?? metadata.display_name ?? null

        // The configured bootstrap account is promoted only after Supabase
        // verifies its password. The database remains the source of role data.
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
        const isConfiguredSuperAdmin = Boolean(superAdminEmail && email === superAdminEmail)

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            ...(name ? { name } : {}),
            ...(isConfiguredSuperAdmin ? { role: "SUPER_ADMIN" as const } : {}),
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
      } catch (error) {
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

        session.user.id = currentUser?.id ?? userId
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
