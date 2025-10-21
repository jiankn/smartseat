import NextAuth, { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@smartseat/db';
import { ensureDefaultOrgId } from '@lib/org';

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Dev Email',
      credentials: { email: { label: 'Email', type: 'text' } },
      async authorize(creds) {
        const allow = process.env.DEV_LOGIN_ALLOW?.toLowerCase();
        const email = (creds?.email || '').toLowerCase();
        if (!allow) throw new Error('DEV_LOGIN_ALLOW not configured');
        if (email !== allow) return null;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) user = await prisma.user.create({ data: { email } });
        return { id: user.id, email: user.email };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      const uid = (user as any)?.id ?? token.sub;
      if (uid && !(token as any).orgId) {
        (token as any).orgId = await ensureDefaultOrgId(uid);
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.sub;
      (session as any).orgId = (token as any).orgId;
      return session;
    },
  },
  pages: { signIn: '/auth/signin' },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export const runtime = 'nodejs';
