import { prisma } from "@/lib/prisma";
import AdminCommissionsManager from "@/components/admin/AdminCommissionsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminIncentivesPage() {
  const [incentives, rules, slabs] = await Promise.all([
    prisma.incentive.findMany({
      include: {
        associate: {
          select: {
            id: true,
            name: true,
            memberId: true,
            phone: true,
            rank: true,
            walletBalance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commissionRule.findMany({
      orderBy: { directPercent: "asc" },
    }),
    prisma.commissionSlab.findMany({
      orderBy: { minSqYard: "asc" },
    }),
  ]);

  const totalPaid = incentives.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
  const totalApproved = incentives.filter((i) => i.status === "APPROVED").reduce((sum, i) => sum + i.amount, 0);
  const totalPending = incentives.filter((i) => i.status === "PENDING").reduce((sum, i) => sum + i.amount, 0);

  return (
    <AdminCommissionsManager
      initialIncentives={incentives as any}
      initialRules={rules}
      initialSlabs={slabs}
      totalPaid={totalPaid}
      totalApproved={totalApproved}
      totalPending={totalPending}
    />
  );
}
