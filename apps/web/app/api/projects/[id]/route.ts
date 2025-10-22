export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err } from '@smartseat/utils';

async function userOwnsProject(userId: string, projectId: string) {
  const p = await prisma.project.findUnique({
    where: { id: projectId },
    select: { orgId: true }
  });
  if (!p) return false;
  const m = await prisma.orgMember.findFirst({
    where: { orgId: p.orgId, userId }
  });
  return !!m;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);

  if (!(await userOwnsProject(session.user.id, params.id))) {
    return err('NOT_FOUND', 'project not found', 404);
  }

  const detail = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, createdAt: true, archived: true,
      tables: { select: { id: true } },
      guests: { select: { id: true } }
    }
  });
  return ok(detail);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);

  if (!(await userOwnsProject(session.user.id, params.id))) {
    return err('NOT_FOUND', 'project not found', 404);
  }

  const body = (await req.json().catch(() => ({}))) as { name?: string; archived?: boolean };
  const data: any = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body.archived === 'boolean') data.archived = body.archived;
  if (Object.keys(data).length === 0) return err('VALIDATION', 'no fields', 422);

  const updated = await prisma.project.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, archived: true }
  });
  return ok(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);

  if (!(await userOwnsProject(session.user.id, params.id))) {
    return err('NOT_FOUND', 'project not found', 404);
  }

  await prisma.project.delete({ where: { id: params.id } });
  return ok({ deleted: true });
}
