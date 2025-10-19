import prisma from '@smartseat/db';

/** 确保当前用户有一个默认组织，并返回 orgId */
export async function ensureDefaultOrgId(userId: string): Promise<string> {
  // 1) 已加入的组织优先
  const joined = await prisma.orgMember.findFirst({
    where: { userId },
    select: { orgId: true },
  });
  if (joined) return joined.orgId;

  // 2) 没有就自动创建一个并把用户设为 owner
  const org = await prisma.org.create({
    data: { name: 'My Organization', ownerId: userId },
  });
  await prisma.orgMember.create({
    data: { userId, orgId: org.id, role: 'owner' },
  });
  return org.id;
}
