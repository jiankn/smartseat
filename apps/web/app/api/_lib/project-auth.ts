import prisma from '@smartseat/db';

/** 项目是否属于该 org（鉴权用） */
export async function projectBelongsToOrg(projectId: string, orgId: string): Promise<boolean> {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { orgId: true } });
  return !!p && p.orgId === orgId;
}
