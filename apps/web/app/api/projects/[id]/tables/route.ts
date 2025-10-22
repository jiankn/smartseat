export const runtime = 'nodejs';

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

  const rows = await prisma.table.findMany({
    where: { projectId: params.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, shape: true, capacity: true, zone: true, locked: true }
  });
  return ok(rows);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  console.log('[POST /api/projects/[id]/tables]', { projectId: params.id, orgId, userId: session.user.id });

  if (!(await projectBelongsToOrg(params.id, orgId))) {
    console.error('[POST /api/projects/[id]/tables] project not found or not belongs to org', { projectId: params.id, orgId });
    return err('NOT_FOUND', 'project not found', 404);
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string; shape?: 'round' | 'rect'; capacity?: number; zone?: string;
  };

  const name = (body.name ?? '').trim();
  const shape = body.shape === 'rect' ? 'rect' : 'round';
  const capacity = Number.isFinite(body.capacity) && (body.capacity as number) > 0 ? body.capacity! : 6;

  if (!name) return err('VALIDATION', 'name is required', 422);

  // 检查桌子数量配额
  const plan = await getOrgPlan(prisma, orgId);
  const ents = getEntitlements(plan);
  const cur = await prisma.table.count({ where: { projectId: params.id } });
  if (ents.maxTablesPerProject && cur >= ents.maxTablesPerProject) {
    return err('QUOTA_EXCEEDED', `该项目桌子数量已达上限(${ents.maxTablesPerProject})，请升级套餐。`, 402);
  }

  const created = await prisma.table.create({
    data: { projectId: params.id, name, shape, capacity, zone: body.zone ?? null, pos: { x: 0, y: 0, angle: 0 } },
    select: { id: true, name: true, shape: true, capacity: true, zone: true, locked: true }
  });

  return ok(created, { status: 201 });
}
