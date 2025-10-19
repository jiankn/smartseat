import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err, getOrgPlan, getEntitlements } from '@smartseat/utils';
import { projectBelongsToOrg } from '../../../_lib/project-auth';
import { ensurePersonalOrg } from '../../../_lib/ensure-org';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  const rows = await prisma.guest.findMany({
    where: { projectId: params.id },
    orderBy: [{ group: 'asc' }, { fullName: 'asc' }],
    select: { id: true, fullName: true, email: true, phone: true, group: true, tags: true }
  });
  return ok(rows);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  const body = (await req.json().catch(() => ({}))) as {
    fullName?: string; email?: string; phone?: string; group?: string; tags?: string[];
  };

  const fullName = (body.fullName ?? '').trim();
  if (!fullName) return err('VALIDATION', 'fullName is required', 422);

  // 检查来宾数量配额
  const plan = await getOrgPlan(prisma, orgId);
  const ents = getEntitlements(plan);
  const cur = await prisma.guest.count({ where: { projectId: params.id } });
  if (ents.maxGuestsPerProject && cur >= ents.maxGuestsPerProject) {
    return err('QUOTA_EXCEEDED', `该项目来宾数量已达上限(${ents.maxGuestsPerProject})，请升级套餐。`, 402);
  }

  const created = await prisma.guest.create({
    data: {
      projectId: params.id,
      fullName,
      email: body.email ?? null,
      phone: body.phone ?? null,
      group: body.group ?? null,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : []
    },
    select: { id: true, fullName: true, email: true, phone: true, group: true, tags: true }
  });

  return ok(created, { status: 201 });
}
