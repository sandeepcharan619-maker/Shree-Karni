import { prisma } from "@/lib/prisma";
import PlotsManager from "@/components/PlotsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlotsPage() {
  const [plots, associates] = await Promise.all([
    prisma.plot.findMany({
      include: {
        sale: {
          include: {
            soldBy: { select: { id: true, name: true, memberId: true } },
          },
        },
      },
      orderBy: { plotNumber: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      select: { id: true, name: true, memberId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PlotsManager
        initialPlots={plots as any}
        initialAssociates={associates}
        title="Plot Inventory Management"
        subtitle="Full registry of plots, size in GAJ, price per GAJ, total pricing, and live availability"
      />
    </div>
  );
}
