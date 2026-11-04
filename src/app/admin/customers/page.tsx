import { prisma } from "@/lib/prisma";
import AdminCustomersManager from "@/components/admin/AdminCustomersManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminCustomersPage() {
  const [customers, associates] = await Promise.all([
    prisma.customer.findMany({
      include: {
        assignedAssociate: {
          select: { id: true, name: true, memberId: true, phone: true },
        },
        bookings: {
          include: {
            plot: {
              select: {
                id: true,
                plotNumber: true,
                projectName: true,
                sizeGaj: true,
                totalPrice: true,
                status: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            paymentMode: true,
            receiptDate: true,
            status: true,
          },
          orderBy: { receiptDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      select: { id: true, name: true, memberId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const enriched = customers.map((c) => {
    const totalBookedValue = c.bookings.reduce((sum, b) => sum + b.totalPlotAmount, 0);
    const totalPaid = c.payments.reduce((sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0), 0);
    const totalOutstanding = Math.max(0, totalBookedValue - totalPaid);

    return {
      ...c,
      totalBookedValue,
      totalPaid,
      totalOutstanding,
    };
  });

  return (
    <AdminCustomersManager
      initialCustomers={enriched as any}
      associates={associates}
    />
  );
}
