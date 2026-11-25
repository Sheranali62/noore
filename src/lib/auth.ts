import { getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import NextAuth from "next-auth"\nimport bcrypt from "bcryptjs"

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

        if (!authResponse.ok) {
          // Keep legacy accounts created before Supabase Auth was connected usable.
          const legacyUser = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() },
          })
          if (!legacyUser?.password) return null
          const matches = await bcrypt.compare(credentials.password, legacyUser.password)
          if (!matches) return null
          return {
            id: legacyUser.id,
            email: legacyUser.email,
            name: legacyUser.name,
            role: legacyUser.role,
          }
        }

        const authResult = await authResponse.json()
        const email = authResult.user?.email?.toLowerCase()
        if (!email) return null

        const metadata = authResult.user.user_metadata ?? {}
        const name =
          metadata.full_name ?? metadata.name ?? metadata.display_name ?? null

        // Only the explicitly configured account can be promoted automatically.
        // Supabase still verifies the password before this code is reached.
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
        console.error("Credentials authentication failed:", error)
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
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

export const auth = () => getServerSession(authOptions)
