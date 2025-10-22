export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err } from '@smartseat/utils';
import { projectBelongsToOrg } from '../../../../_lib/project-auth';
import { ensurePersonalOrg } from '../../../../_lib/ensure-org';

export async function GET(_: Request, { params }: { params: { id: string; tid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  const row = await prisma.table.findUnique({
    where: { id: params.tid },
    select: { id: true, name: true, shape: true, capacity: true, zone: true, locked: true }
  });
  if (!row) return err('NOT_FOUND', 'table not found', 404);
  return ok(row);
}

export async function PATCH(req: Request, { params }: { params: { id: string; tid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  const body = (await req.json().catch(() => ({}))) as {
    name?: string; capacity?: number; zone?: string | null; locked?: boolean;
  };

  const data: any = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (Number.isFinite(body.capacity)) data.capacity = Math.max(1, Math.floor(body.capacity!));
  if (typeof body.locked === 'boolean') data.locked = body.locked;
  if (body.zone === null) data.zone = null;
  if (typeof body.zone === 'string') data.zone = body.zone.trim();

  if (Object.keys(data).length === 0) return err('VALIDATION', 'no fields', 422);

  const updated = await prisma.table.update({
    where: { id: params.tid },
    data,
    select: { id: true, name: true, shape: true, capacity: true, zone: true, locked: true }
  });
  return ok(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string; tid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  await prisma.table.delete({ where: { id: params.tid } });
  return ok({ deleted: true });
}
