import { prisma } from "@/lib/prisma";
import AdminProjectsManager from "@/components/admin/AdminProjectsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminProjectsPage() {
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

  const projects = rawProjects.map((proj) => {
    const soldPlots = proj.plots.filter((p) => p.status === "SOLD").length;
    const bookedPlots = proj.plots.filter((p) => p.status === "BOOKED" || p.status === "RESERVED").length;
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
      plotPrefix: proj.plotPrefix || "SKC-",
      baseRatePerGaj: proj.baseRatePerGaj || 11500,
      baseSizeGaj: proj.baseSizeGaj || 150,
      plotsCount: totalPlots,
      availablePlots,
      bookedPlots,
      soldPlots,
      totalInventoryValue,
      soldSalesValue,
    };
  });

  return <AdminProjectsManager initialProjects={projects} />;
}
