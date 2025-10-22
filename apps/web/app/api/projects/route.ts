export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err, getOrgPlan, getEntitlements } from '@smartseat/utils';
import { type ApiResponse } from '@smartseat/types';

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
  const projects = await prisma.project.findMany({
    where: { orgId, archived: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true }
  });
  return ok(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);

  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  if (!name || name.trim().length < 1) {
    return err('VALIDATION', 'name is required', 422);
  }

  const orgId = await ensurePersonalOrg(session.user.id);

  // 检查项目数量配额
  const plan = await getOrgPlan(prisma, orgId);
  const ents = getEntitlements(plan);
  const count = await prisma.project.count({ where: { orgId, archived: false } });
  
  if (typeof ents.maxProjects === 'number' && count >= ents.maxProjects) {
    return err('QUOTA_EXCEEDED', `项目数量已达上限(${ents.maxProjects})，请升级套餐。`, 402);
  }

  const project = await prisma.project.create({
    data: { orgId, name: name.trim() },
    select: { id: true, name: true, createdAt: true }
  });

  return ok(project, { status: 201 });
}
