import { prisma } from "@/lib/prisma";
import AdminPaymentsManager from "@/components/admin/AdminPaymentsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminPaymentsPage() {
  const [payments, rawBookings] = await Promise.all([
    prisma.payment.findMany({
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            totalPlotAmount: true,
            balanceAmount: true,
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
          },
        },
        plot: {
          select: {
            id: true,
            plotNumber: true,
            projectName: true,
            location: true,
            sizeGaj: true,
          },
        },
        collectedBy: {
          select: {
            id: true,
            name: true,
            memberId: true,
          },
        },
      },
      orderBy: { receiptDate: "desc" },
    }),
    prisma.booking.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        id: true,
        bookingNumber: true,
        customerName: true,
        customerPhone: true,
        totalPlotAmount: true,
        balanceAmount: true,
        plot: { select: { plotNumber: true, projectName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCollected = payments.reduce((sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0), 0);

  const modeTotals = {
    UPI: payments.filter((p) => p.paymentMode === "UPI" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
    CASH: payments.filter((p) => p.paymentMode === "CASH" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
    CHEQUE: payments.filter((p) => p.paymentMode === "CHEQUE" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
    BANK_TRANSFER: payments.filter((p) => p.paymentMode === "BANK_TRANSFER" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
  };

  return (
    <AdminPaymentsManager
      initialPayments={payments as any}
      bookings={rawBookings}
      totalCollected={totalCollected}
      modeTotals={modeTotals}
    />
  );
}
