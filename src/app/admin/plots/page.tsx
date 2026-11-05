import { prisma } from "@/lib/prisma";
import AdminPlotsManager from "@/components/admin/AdminPlotsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminPlotsPage() {
  const [plots, projects, associates] = await Promise.all([
    prisma.plot.findMany({
      include: {
        project: { select: { id: true, name: true, location: true } },
        sale: {
          include: {
            soldBy: { select: { id: true, name: true, memberId: true } },
          },
        },
        customer: { select: { id: true, name: true, phone: true, customerId: true } },
        assignedAssociate: { select: { id: true, name: true, memberId: true } },
        bookings: {
          select: {
            id: true,
            bookingNumber: true,
            customerName: true,
            customerPhone: true,
            bookingAmount: true,
            balanceAmount: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { plotNumber: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      select: { id: true, name: true, memberId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminPlotsManager
      initialPlots={plots as any}
      projects={projects}
      associates={associates}
    />
  );
}
