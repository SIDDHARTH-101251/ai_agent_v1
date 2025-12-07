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
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const DAILY_LIMIT = Number(process.env.DAILY_RESPONSE_LIMIT ?? "20");
const MAX_JWT_FIELD_LENGTH = 512;

const safeString = (value?: string | null, maxLength = MAX_JWT_FIELD_LENGTH) => {
  if (typeof value !== "string") return undefined;
  if (value.length > maxLength) return undefined;
  return value;
};

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
              isAdmin: username.toLowerCase() === adminUsername.toLowerCase(),
            },
          });
          return {
            id: created.id,
            name: created.username ?? created.name ?? "",
            email: created.email ?? undefined,
            themeName: created.themeName,
            themeMode: created.themeMode,
            profileSummary: created.profileSummary,
            image: created.image,
            isAdmin: created.isAdmin,
            hasGoogleKey: Boolean(created.googleApiKeyCipher),
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
          image: user.image,
          isAdmin: user.isAdmin,
          hasGoogleKey: Boolean(user.googleApiKeyCipher),
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
          isAdmin?: boolean;
          hasGoogleKey?: boolean;
        };
        token.id = anyUser.id;
        token.name = anyUser.username ?? anyUser.name ?? token.name;
        token.email = anyUser.email ?? token.email;
        token.themeName = anyUser.themeName;
        token.themeMode = anyUser.themeMode;
        token.profileSummary = safeString(anyUser.profileSummary, 1000) ?? null;
        const safeImage = safeString(anyUser.image);
        if (safeImage) {
          token.picture = safeImage;
        } else if (token.picture && typeof token.picture === "string" && token.picture.length > MAX_JWT_FIELD_LENGTH) {
          // Drop over-sized existing image values to keep the JWT small.
          delete (token as any).picture;
        }
        (token as any).isAdmin = anyUser.isAdmin ?? false;
        (token as any).hasGoogleKey = anyUser.hasGoogleKey ?? false;
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
          isAdmin?: boolean;
          hasGoogleKey?: boolean;
        };
        u.id = token.id as string | undefined;
        u.themeName = (token as any).themeName;
        u.themeMode = (token as any).themeMode;
        u.profileSummary = safeString((token as any).profileSummary, 1000) ?? null;
        u.name = (token.name as string) ?? u.name ?? null;
        u.image = safeString(token.picture as string | undefined) ?? u.image ?? null;
        (u as any).isAdmin = (token as any).isAdmin ?? false;
        if (u.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: u.id },
            select: { googleApiKeyCipher: true },
          });
          const hasKey = Boolean(dbUser?.googleApiKeyCipher);
          (u as any).hasGoogleKey = hasKey;
          (token as any).hasGoogleKey = hasKey;
        } else {
          (u as any).hasGoogleKey = (token as any).hasGoogleKey ?? false;
        }
      }
      return session;
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);
export const createPasswordHash = hashPassword;
export const DAILY_RESPONSE_LIMIT = DAILY_LIMIT;
