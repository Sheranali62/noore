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
        const legacyUser = await prisma.user.findFirst({
          where: { email: { equals: emailInput, mode: "insensitive" } },
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

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseAnonKey) {
        if (process.env.NODE_ENV === "production") return null
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
              email: credentials.email.trim().toLowerCase(),
              password: credentials.password,
            }),
            cache: "no-store",
          }
        )

        if (!authResponse.ok) {
          // Do not fall back to an old bcrypt hash after a Supabase password
          // failure; that could bypass a password reset or a changed password.
          return null
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

        const existingUser = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true },
        })
        const user = existingUser
          ? await prisma.user.update({
              where: { id: existingUser.id },
              data: { ...(name ? { name } : {}) },
            })
          : await prisma.user.create({
              data: {
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
    async jwt({ token, user, trigger }) {
      const userId = user?.id ?? (trigger === "update" && typeof token.id === "string" ? token.id : null)
      if (userId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, name: true, email: true, updatedAt: true },
        })
        token.role = currentUser?.role ?? "CUSTOMER"
        token.id = currentUser?.id ?? ""
        token.name = currentUser?.name ?? null
        token.email = currentUser?.email ?? null
        token.userUpdatedAt = currentUser?.updatedAt.getTime() ?? 0
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

        // Resolve permissions from the canonical user row on every session read.
        // Deleted users and stale staff-role claims must never remain authorized.
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true, updatedAt: true },
        })
        const tokenUpdatedAt = typeof token.userUpdatedAt === "number" ? token.userUpdatedAt : 0
        if (!currentUser || !tokenUpdatedAt || currentUser.updatedAt.getTime() !== tokenUpdatedAt) {
          // Invalidate sessions after password changes and other account updates.
          session.user.id = ""
          session.user.role = "CUSTOMER"
          return session
        }
        session.user.id = currentUser.id
        session.user.role = currentUser.role
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

export const auth = () => getServerSession(authOptions)
