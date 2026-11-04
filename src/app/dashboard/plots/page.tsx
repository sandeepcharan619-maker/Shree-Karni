import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssociatePlotsViewer, { PlotItem } from "./AssociatePlotsViewer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams?: Promise<{ project?: string }>;
}

export default async function PlotManagerPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const projectFilter = resolvedParams?.project || "ALL";

  let plots: PlotItem[] = [];
  try {
    const dbPlots = await prisma.plot.findMany({
      include: {
        project: { select: { id: true, name: true, location: true } },
      },
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
      facing: p.facing,
      dimensions: p.dimensions,
      roadWidth: p.roadWidth,
      sector: p.sector,
      projectId: p.projectId,
      project: p.project,
    }));
  } catch (e) {
    console.error("Plots query error:", e);
  }

  return (
    <div className="w-full">
      <AssociatePlotsViewer
        initialPlots={plots}
        initialProjectFilter={projectFilter}
      />
    </div>
  );
}
