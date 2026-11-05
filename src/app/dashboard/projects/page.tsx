import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AssociateProjectsViewer, { ProjectItem } from "./AssociateProjectsViewer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssociateProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const rawProjects = await prisma.project.findMany({
    include: {
      plots: {
        select: {
          id: true,
          status: true,
          sizeGaj: true,
          totalPrice: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const projects: ProjectItem[] = rawProjects.map((proj) => {
    const soldPlots = proj.plots.filter((p) => p.status === "SOLD").length;
    const bookedPlots = proj.plots.filter(
      (p) => p.status === "BOOKED" || p.status === "RESERVED"
    ).length;
    const totalPlots =
      proj.totalPlotsCount !== null && proj.totalPlotsCount !== undefined
        ? proj.totalPlotsCount
        : proj.plots.length;
    const availablePlots = Math.max(0, totalPlots - (soldPlots + bookedPlots));
    const totalInventoryValue = proj.plots.reduce((sum, p) => sum + p.totalPrice, 0);
    const soldSalesValue = proj.plots
      .filter((p) => p.status === "SOLD")
      .reduce((sum, p) => sum + p.totalPrice, 0);

    return {
      id: proj.id,
      name: proj.name,
      location: proj.location,
      description: proj.description,
      status: proj.status,
      totalAcreage: proj.totalAcreage,
      totalPlotsCount: totalPlots,
      imageUrl: proj.imageUrl,
      layoutMapUrl: proj.layoutMapUrl,
      plotsCount: totalPlots,
      availablePlots,
      bookedPlots,
      soldPlots,
      totalInventoryValue,
      soldSalesValue,
    };
  });

  return (
    <div className="w-full">
      <AssociateProjectsViewer initialProjects={projects} />
    </div>
  );
}
