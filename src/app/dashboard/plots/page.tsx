import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssociatePlotsViewer, { PlotData } from "./AssociatePlotsViewer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";

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
    <div className="w-full max-w-6xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-amber-500" size={22} />
            <span>Plot Inventory & Layout Map</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Browse available residential plots in Shree Karni townships across Vatika, Jaipur.
          </p>
        </div>
        <Link
          href="/dashboard/business"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold text-xs shadow-md transition self-start sm:self-auto"
        >
          <Briefcase size={15} />
          <span>View My Business (Sold Plots) →</span>
        </Link>
      </div>

      <AssociatePlotsViewer initialPlots={plots} />
    </div>
  );
}
