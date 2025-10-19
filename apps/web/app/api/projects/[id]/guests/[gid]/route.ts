import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err } from '@smartseat/utils';
import { projectBelongsToOrg } from '../../../../_lib/project-auth';
import { ensurePersonalOrg } from '../../../../_lib/ensure-org';

export async function PATCH(req: Request, { params }: { params: { id: string; gid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  const b = (await req.json().catch(() => ({}))) as {
    fullName?: string; email?: string | null; phone?: string | null; group?: string | null; tags?: string[];
  };

  const data: any = {};
  if (typeof b.fullName === 'string' && b.fullName.trim()) data.fullName = b.fullName.trim();
  if (b.email === null) data.email = null; else if (typeof b.email === 'string') data.email = b.email.trim();
  if (b.phone === null) data.phone = null; else if (typeof b.phone === 'string') data.phone = b.phone.trim();
  if (b.group === null) data.group = null; else if (typeof b.group === 'string') data.group = b.group.trim();
  if (Array.isArray(b.tags)) data.tags = b.tags.slice(0, 10);

  if (Object.keys(data).length === 0) return err('VALIDATION', 'no fields', 422);

  const updated = await prisma.guest.update({
    where: { id: params.gid },
    data,
    select: { id: true, fullName: true, email: true, phone: true, group: true, tags: true }
  });
  return ok(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string; gid: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  await prisma.guest.delete({ where: { id: params.gid } });
  return ok({ deleted: true });
}
