import prisma from '@smartseat/db';

export async function userOwnsProjectByOrg(orgId: string, projectId: string) {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { orgId: true } });
  return !!p && p.orgId === orgId;
}
