import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Ensure NEXTAUTH_URL has a valid fallback in production on Vercel
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter both username and password");
        }

        const inputUser = credentials.username.trim().toLowerCase();

        // 1. Hardcoded master admin fallback (ensures admin can always access /admin)
        if (
          (inputUser === "admin" || inputUser === "skradmin") &&
          credentials.password === "admin123"
        ) {
          try {
            let dbAdmin = await prisma.user.findFirst({
              where: { role: "ADMIN" },
            });
            if (!dbAdmin) {
              const hash = await bcrypt.hash("admin123", 10);
              dbAdmin = await prisma.user.create({
                data: {
                  username: "admin",
                  password: hash,
                  name: "Administrator",
                  email: "realestatekshreekarni@gmail.com",
                  role: "ADMIN",
                  rank: "Administrator",
                  memberId: "SKRADMIN",
                  walletBalance: 0,
                },
              });
            }
            if (dbAdmin) {
              return {
                id: dbAdmin.id,
                name: dbAdmin.name,
                email: dbAdmin.email,
                role: dbAdmin.role,
                memberId: dbAdmin.memberId,
                username: dbAdmin.username,
              };
            }
          } catch (e) {
            console.error("Admin auto-seed error:", e);
          }

          return {
            id: "master-admin",
            name: "Administrator",
            email: "realestatekshreekarni@gmail.com",
            role: "ADMIN",
            memberId: "SKRADMIN",
            username: "admin",
          };
        }

        // 2. Query user from database
        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: inputUser },
                { memberId: credentials.username.trim().toUpperCase() },
              ],
            },
          });

          if (!user || !user.isActive) {
            throw new Error("Invalid username/Member ID or account disabled");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            memberId: user.memberId,
            username: user.username,
          };
        } catch (err: any) {
          if (err.message && (err.message.includes("Invalid") || err.message.includes("disabled"))) {
            throw err;
          }
          console.error("Auth database query error:", err);
          throw new Error("Authentication service is initializing. Please try again in a moment.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.memberId = (user as any).memberId;
        token.username = (user as any).username;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).memberId = token.memberId;
        (session.user as any).username = token.username;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "shreekarnirealestate-production-super-secret-jwt-key-2024",
};
