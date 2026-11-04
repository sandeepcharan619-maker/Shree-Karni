import { prisma } from "@/lib/prisma";
import AdminSettingsManager from "@/components/admin/AdminSettingsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminSettingsPage() {
  const [activityLogs, adminUser, projectCount, plotCount, customerCount, bookingCount, paymentCount, associateCount] =
    await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          memberId: true,
          createdAt: true,
        },
      }),
      prisma.project.count(),
      prisma.plot.count(),
      prisma.customer.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.user.count({ where: { role: "ASSOCIATE" } }),
    ]);

  const totalRecords = {
    projects: projectCount,
    plots: plotCount,
    customers: customerCount,
    bookings: bookingCount,
    payments: paymentCount,
    associates: associateCount,
    activityLogs: activityLogs.length,
  };

  return (
    <AdminSettingsManager
      adminUser={adminUser}
      activityLogs={activityLogs as any}
      totalRecords={totalRecords}
    />
  );
}
