import prisma from '@smartseat/db';
import { getOrgPlan, getEntitlements } from '@smartseat/utils';

export async function loadOrgUsage(orgId: string) {
  const [plan, projects] = await Promise.all([
    getOrgPlan(prisma, orgId),
    prisma.project.findMany({
      where: { orgId, archived: false },
      select: {
        id: true,
        _count: {
          select: {
            tables: true,
            guests: true
          }
        }
      }
    })
  ]);

  const ents = getEntitlements(plan);
  
  return {
    plan,
    entitlements: {
      label: plan.charAt(0).toUpperCase() + plan.slice(1), // Free, Pro, Business
      maxProjects: typeof ents.maxProjects === 'number' ? ents.maxProjects : 999999,
      maxTablesPerProject: ents.maxTablesPerProject || 999999,
      maxGuestsPerProject: ents.maxGuestsPerProject || 999999,
      realtimeCollab: ents.commentEnabled || false,
      watermark: ents.watermark
    },
    usage: {
      projects: projects.length,
      byProject: projects.map(p => ({
        projectId: p.id,
        tables: p._count.tables,
        guests: p._count.guests
      }))
    }
  };
}
