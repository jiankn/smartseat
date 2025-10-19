import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding (idempotent)...');

  // 1) 用户（可重复执行）
  const user = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: { email: 'owner@example.com', name: 'Owner' }
  });

  // 2) 个人组织：若该用户已存在组织则复用，否则创建
  let org = await prisma.org.findFirst({ where: { ownerId: user.id } });
  if (!org) {
    org = await prisma.org.create({
      data: { name: 'My Org', ownerId: user.id }
    });
  }

  // 3) 组织成员（owner），用复合主键 upsert 防重
  await prisma.orgMember.upsert({
    where: { orgId_userId: { orgId: org.id, userId: user.id } },
    update: { role: 'owner' },
    create: { orgId: org.id, userId: user.id, role: 'owner' }
  });

  // 4) Demo Project：仅在该 org 还没有项目时创建
  let project = await prisma.project.findFirst({ where: { orgId: org.id } });
  if (!project) {
    project = await prisma.project.create({
      data: { orgId: org.id, name: 'Demo Project', locale: 'en', currency: 'USD', paperSize: 'A4' }
    });

    // Demo tables
    await prisma.table.createMany({
      data: [
        { projectId: project.id, name: 'T1', shape: 'round', capacity: 8, pos: { x: 80, y: 80, angle: 0 }, zone: 'A' },
        { projectId: project.id, name: 'T2', shape: 'rect',  capacity: 6, pos: { x: 260, y: 80, angle: 0 }, zone: 'A' },
        { projectId: project.id, name: 'T3', shape: 'round', capacity: 8, pos: { x: 440, y: 80, angle: 0 }, zone: 'B' }
      ]
    });

    // Demo guests
    await prisma.$transaction(
      Array.from({ length: 10 }).map((_, i) =>
        prisma.guest.create({
          data: { projectId: project.id, fullName: `Guest ${i + 1}`, group: i % 2 === 0 ? 'A' : 'B', tags: [] }
        })
      )
    );
  }

  console.log('Seed done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
