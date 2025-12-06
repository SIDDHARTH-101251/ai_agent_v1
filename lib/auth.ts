import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        const u = session.user as {
          id?: string;
          themeName?: string;
          themeMode?: string;
          profileSummary?: string | null;
        };
        const anyUser = user as unknown as {
          id?: string;
          themeName?: string;
          themeMode?: string;
          profileSummary?: string | null;
        };
        u.id = anyUser.id;
        u.themeName = anyUser.themeName;
        u.themeMode = anyUser.themeMode;
        u.profileSummary = anyUser.profileSummary ?? null;
      }
      return session;
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);
