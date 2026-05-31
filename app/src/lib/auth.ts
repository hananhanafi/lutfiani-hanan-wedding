import { getServerSession } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // Primary admin via env vars (backward-compatible)
        if (
          credentials.username === process.env.ADMIN_USERNAME &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "admin-env", name: "Admin", role: "admin" };
        }

        // Staff accounts (stored in DB) — lookup by email OR username
        const { data: staff } = await supabaseAdmin
          .from("staff")
          .select("id, name, email, username, password_hash, role, is_active")
          .or(`email.eq.${credentials.username.trim().toLowerCase()},username.eq.${credentials.username.trim()}`)
          .single();

        if (!staff || !staff.is_active) return null;

        const valid = await bcrypt.compare(credentials.password, staff.password_hash as string);
        if (!valid) return null;

        return { id: staff.id as string, name: staff.name as string, email: staff.email as string, role: staff.role as string };
      },
    }),
  ],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user?: { id?: string; role?: string } }) {
      if (user) {
        token.role = user.role ?? "admin";
        token.staffId = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: { user?: Record<string, unknown> }; token: Record<string, unknown> }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "admin";
        session.user.staffId = token.staffId as string | undefined;
      }
      return session;
    },
  },
};

export const getAdminSession = () => getServerSession(authOptions);
