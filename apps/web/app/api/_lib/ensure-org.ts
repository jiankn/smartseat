import prisma from '@smartseat/db';

/** 确保用户有一个组织（如果没有则创建个人组织） */
export async function ensurePersonalOrg(userId: string): Promise<string> {
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
