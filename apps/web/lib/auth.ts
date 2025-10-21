import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@smartseat/db';
import { ensureDefaultOrgId } from './org';

const allowList = (process.env.DEV_LOGIN_ALLOW ?? 'owner@example.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// 支持在 .env 写 DEV_LOGIN_ALLOW="*" 表示开发环境允许任意邮箱
const devOpenLogin = (process.env.DEV_LOGIN_ALLOW ?? '').trim() === '*';

// 允许在生产环境使用开发登录（仅用于测试，生产环境应使用真实 OAuth）
const allowDevLoginInProd = process.env.ALLOW_DEV_LOGIN_IN_PROD === 'true';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Dev Email',
      credentials: { email: { label: 'Email', type: 'email' } },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        console.log('[auth] incoming email =', email);
        console.log('[auth] NODE_ENV =', process.env.NODE_ENV);
        console.log('[auth] allowList =', allowList);
        console.log('[auth] allowDevLoginInProd =', allowDevLoginInProd);

        if (!email) return null;

        const isProduction = process.env.NODE_ENV === 'production';
        const emailAllowed = devOpenLogin || allowList.includes(email);

        if (!emailAllowed) {
          console.log('[auth] blocked: not in allowList');
          return null;
        }

        if (devOpenLogin && isProduction && !allowDevLoginInProd) {
          console.log('[auth] blocked: devOpenLogin disabled in production');
          return null;
        }

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split('@')[0] }
        });
        const u: NextAuthUser = { id: user.id, email: user.email, name: user.name ?? user.email };
        console.log('[auth] upserted user id =', user.id);
        return u;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // user 首次登录时会有；之后只有 token
      const userId = (user as any)?.id ?? token.sub;
      if (userId && !('orgId' in token)) {
        token.orgId = await ensureDefaultOrgId(userId);
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.sub;           // 方便服务端拿 user id
      (session as any).orgId = (token as any).orgId;   // 关键：把 orgId 放进 session
      return session;
    }
  },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET
};
