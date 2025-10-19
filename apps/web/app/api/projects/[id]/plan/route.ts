import { getServerSession } from 'next-auth';
import { authOptions } from '@lib/auth';
import prisma from '@smartseat/db';
import { ok, err } from '@smartseat/utils';
import { projectBelongsToOrg } from '../../../_lib/project-auth';
import { ensurePersonalOrg } from '../../../_lib/ensure-org';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  const [tables, guests, assigns] = await Promise.all([
    prisma.table.findMany({
      where: { projectId: params.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, shape: true, capacity: true, zone: true, locked: true, pos: true }
    }),
    prisma.guest.findMany({
      where: { projectId: params.id },
      orderBy: [{ group: 'asc' }, { fullName: 'asc' }],
      select: { id: true, fullName: true, group: true, tags: true }
    }),
    prisma.seatAssignment.findMany({
      where: { projectId: params.id },
      select: { id: true, tableId: true, guestId: true, seatIndex: true, locked: true }
    })
  ]);

  return ok({ tables, guests, assignments: assigns });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err('UNAUTHORIZED', 'Sign in required', 401);
  const orgId = await ensurePersonalOrg(session.user.id);

  if (!(await projectBelongsToOrg(params.id, orgId))) return err('NOT_FOUND', 'project not found', 404);

  const body = (await req.json().catch(() => ({}))) as {
    tables?: Array<{ id: string; pos?: { x: number; y: number; angle?: number }; locked?: boolean }>;
    assignments?: Array<{ tableId: string; guestId: string; seatIndex: number; locked?: boolean }>;
  };

  const tables = Array.isArray(body.tables) ? body.tables : [];
  const assignments = Array.isArray(body.assignments) ? body.assignments : [];

  await prisma.$transaction(async (tx) => {
    // 更新桌子位置/锁定
    for (const t of tables) {
      const data: any = {};
      if (t.pos) data.pos = { x: Math.round(t.pos.x), y: Math.round(t.pos.y), angle: Math.round(t.pos.angle ?? 0) };
      if (typeof t.locked === 'boolean') data.locked = t.locked;
      if (Object.keys(data).length) await tx.table.update({ where: { id: t.id }, data });
    }
    // 全量替换分配（简单可靠）
    await tx.seatAssignment.deleteMany({ where: { projectId: params.id } });
    if (assignments.length) {
      await tx.seatAssignment.createMany({
        data: assignments.map(a => ({
          projectId: params.id,
          tableId: a.tableId,
          guestId: a.guestId,
          seatIndex: a.seatIndex,
          locked: !!a.locked
        }))
      });
    }
  });

  return ok({ saved: true });
}
