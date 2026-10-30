import { prisma } from "@/lib/prisma";
import AdminCrmSuite from "@/components/crm/AdminCrmSuite";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialTab = resolvedParams?.tab || "crm_overview";

  const totalAssociates = await prisma.user.count({ where: { role: "ASSOCIATE" } });
  const totalPlots = await prisma.plot.count();
  const availablePlots = await prisma.plot.count({ where: { status: "AVAILABLE" } });

  // Fetch all associates for the CRM & manager
  const associates = await prisma.user.findMany({
    where: { role: "ASSOCIATE" },
    include: {
      referredBy: { select: { id: true, name: true, memberId: true } },
      _count: { select: { referrals: true, sales: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all plots for inventory & property matcher
  const plots = await prisma.plot.findMany({
    include: {
      sale: {
        include: {
          soldBy: { select: { id: true, name: true, memberId: true } },
        },
      },
    },
    orderBy: { plotNumber: "asc" },
  });

  // Fetch CRM leads
  const leads = await prisma.lead.findMany({
    include: {
      associate: {
        select: { id: true, name: true, memberId: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch CRM site visits
  const visits = await prisma.visitor.findMany({
    include: {
      associate: {
        select: { id: true, name: true, memberId: true },
      },
    },
    orderBy: { visitDate: "asc" },
  });

  // Recent Sales
  const recentSales = await prisma.sale.findMany({
    take: 10,
    orderBy: { saleDate: "desc" },
    include: {
      plot: true,
      soldBy: { select: { name: true, memberId: true } },
    },
  });

  return (
    <div className="space-y-6">
      <AdminCrmSuite
        initialTab={initialTab}
        initialLeads={leads as any}
        initialVisits={visits as any}
        initialPlots={plots as any}
        initialAssociates={associates as any}
        initialRecentSales={recentSales as any}
        totalAssociatesCount={totalAssociates}
        availablePlotsCount={availablePlots}
      />
    </div>
  );
}
