export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import { ok, err } from '@smartseat/utils';
import { loadOrgUsage } from '@lib/entitlements';
import prisma from '@smartseat/db';

async function ensurePersonalOrg(userId: string) {
  const member = await prisma.orgMember.findFirst({ where: { userId } });
  if (member) return member.orgId;

  const org = await prisma.org.create({
    data: { name: 'My Org', ownerId: userId }
  });
  await prisma.orgMember.create({
    data: { orgId: org.id, userId, role: 'owner' }
  });
  return org.id;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  
  const orgId = await ensurePersonalOrg(session.user.id);
  const result = await loadOrgUsage(orgId);
  return ok(result);
}
