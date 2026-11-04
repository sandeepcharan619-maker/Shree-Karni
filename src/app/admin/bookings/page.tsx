import { prisma } from "@/lib/prisma";
import AdminBookingsManager from "@/components/admin/AdminBookingsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminBookingsPage() {
  const [bookings, availablePlots, associates, customers] = await Promise.all([
    prisma.booking.findMany({
      include: {
        plot: {
          select: {
            id: true,
            plotNumber: true,
            projectName: true,
            location: true,
            sizeGaj: true,
            pricePerGaj: true,
            totalPrice: true,
            facing: true,
            roadWidth: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            customerId: true,
            name: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        associate: {
          select: {
            id: true,
            memberId: true,
            name: true,
            phone: true,
            rank: true,
          },
        },
        payments: {
          orderBy: { receiptDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plot.findMany({
      where: { status: "AVAILABLE" },
      select: {
        id: true,
        plotNumber: true,
        projectName: true,
        sizeGaj: true,
        pricePerGaj: true,
        totalPrice: true,
      },
      orderBy: { plotNumber: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      select: { id: true, name: true, memberId: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      select: { id: true, customerId: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AdminBookingsManager
      initialBookings={bookings as any}
      availablePlots={availablePlots}
      associates={associates}
      customers={customers}
    />
  );
}
