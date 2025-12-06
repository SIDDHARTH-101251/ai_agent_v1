import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
};

const verifyPassword = (password: string, stored?: string | null) => {
  if (!stored) return false;
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const storedKey = Buffer.from(key, "hex");
  if (derived.length !== storedKey.length) return false;
  return timingSafeEqual(derived, storedKey);
};

const nextAuthSecret = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  jwt: { secret: nextAuthSecret },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;
        const username = (credentials.username as string).trim();
        const password = credentials.password as string;
        const action = (credentials as { action?: string }).action ?? "login";

        if (username.length < 3 || password.length < 6) {
          throw new Error("Username must be 3+ chars and password 6+ chars");
        }

        if (action === "register") {
          const existing = await prisma.user.findFirst({
            where: { username },
          });
          if (existing) {
            throw new Error("Username already exists");
          }
          const created = await prisma.user.create({
            data: {
              username,
              name: username,
              passwordHash: hashPassword(password),
            },
          });
          return {
            id: created.id,
            name: created.username ?? created.name ?? "",
            email: created.email ?? undefined,
            themeName: created.themeName,
            themeMode: created.themeMode,
            profileSummary: created.profileSummary,
          } as any;
        }

        const user = await prisma.user.findFirst({
          where: { username },
        });
        if (!user || !verifyPassword(password, user.passwordHash)) {
          throw new Error("Invalid username or password");
        }
        return {
          id: user.id,
          name: user.username ?? user.name ?? "",
          email: user.email ?? undefined,
          themeName: user.themeName,
          themeMode: user.themeMode,
          profileSummary: user.profileSummary,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  secret: nextAuthSecret,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const anyUser = user as {
          id?: string;
          themeName?: string;
          themeMode?: string;
          profileSummary?: string | null;
          username?: string | null;
          name?: string | null;
          email?: string | null;
          image?: string | null;
        };
        token.id = anyUser.id;
        token.name = anyUser.username ?? anyUser.name ?? token.name;
        token.email = anyUser.email ?? token.email;
        token.themeName = anyUser.themeName;
        token.themeMode = anyUser.themeMode;
        token.profileSummary = anyUser.profileSummary ?? null;
        token.picture = anyUser.image ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          id?: string;
          themeName?: string;
          themeMode?: string;
          profileSummary?: string | null;
          name?: string | null;
          image?: string | null;
        };
        u.id = token.id as string | undefined;
        u.themeName = (token as any).themeName;
        u.themeMode = (token as any).themeMode;
        u.profileSummary = (token as any).profileSummary ?? null;
        u.name = (token.name as string) ?? u.name ?? null;
        u.image = (token.picture as string) ?? u.image ?? null;
      }
      return session;
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);
export const createPasswordHash = hashPassword;
