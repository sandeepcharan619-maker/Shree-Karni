import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssociatePlotsViewer, { PlotData } from "./AssociatePlotsViewer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlotManagerPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  let plots: PlotData[] = [];
  try {
    const dbPlots = await prisma.plot.findMany({
      orderBy: { plotNumber: "asc" },
    });

    plots = dbPlots.map((p) => ({
      id: p.id,
      plotNumber: p.plotNumber,
      projectName: p.projectName,
      location: p.location,
      sizeGaj: p.sizeGaj,
      pricePerGaj: p.pricePerGaj,
      totalPrice: p.totalPrice,
      status: p.status,
      createdAt: p.createdAt,
    }));
  } catch (e) {
    console.error("Plots query error:", e);
  }

  return (
    <div className="w-full max-w-6xl">
      <AssociatePlotsViewer initialPlots={plots} />
    </div>
  );
}
