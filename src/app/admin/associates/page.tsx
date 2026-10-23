import { prisma } from "@/lib/prisma";
import AssociatesManager from "@/components/AssociatesManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAssociatesPage() {
  const associates = await prisma.user.findMany({
    where: { role: "ASSOCIATE" },
    include: {
      referredBy: { select: { id: true, name: true, memberId: true } },
      _count: { select: { referrals: true, sales: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AssociatesManager
        initialAssociates={associates}
        title="All Associates Network"
        subtitle="Manage sales team members, view downlines, update rank tiers, and remove records"
      />
    </div>
  );
}
