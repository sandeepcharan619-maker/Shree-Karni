import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
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
    });

    const totalCollected = payments.reduce((sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0), 0);

    const modeTotals = {
      UPI: payments.filter((p) => p.paymentMode === "UPI" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
      CASH: payments.filter((p) => p.paymentMode === "CASH" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
      CHEQUE: payments.filter((p) => p.paymentMode === "CHEQUE" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
      BANK_TRANSFER: payments.filter((p) => p.paymentMode === "BANK_TRANSFER" && p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0),
    };

    return NextResponse.json({
      payments,
      totalCollected,
      modeTotals,
    });
  } catch (error: any) {
    console.error("GET /api/admin/payments error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      bookingId,
      customerId,
      plotId,
      amount,
      paymentType = "INSTALLMENT",
      paymentMode = "UPI",
      transactionRef,
      bankName,
      remarks,
    } = body;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Please enter a valid payment amount" }, { status: 400 });
    }

    let resolvedBooking = null;
    if (bookingId) {
      resolvedBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { plot: true, customer: true },
      });
    }

    // Generate Receipt Number
    const lastPayment = await prisma.payment.findFirst({
      where: { receiptNumber: { startsWith: "SKR-REC-" } },
      orderBy: { receiptNumber: "desc" },
    });
    let nextRecNum = 1;
    if (lastPayment && lastPayment.receiptNumber) {
      const parts = lastPayment.receiptNumber.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextRecNum = num + 1;
    }
    const receiptNumber = `SKR-REC-2026-${String(nextRecNum).padStart(3, "0")}`;

    const payment = await prisma.payment.create({
      data: {
        receiptNumber,
        bookingId: bookingId || null,
        customerId: customerId || resolvedBooking?.customerId || null,
        plotId: plotId || resolvedBooking?.plotId || null,
        amount: numericAmount,
        paymentType: paymentType || "INSTALLMENT",
        paymentMode: paymentMode || "UPI",
        transactionRef: transactionRef || `TXN-${Date.now()}`,
        bankName: bankName || null,
        status: "SUCCESS",
        collectedById: session.user.id,
        remarks: remarks || "Payment received",
      },
    });

    // If associated with a booking, deduct the balance amount
    if (resolvedBooking) {
      const newBalance = Math.max(0, resolvedBooking.balanceAmount - numericAmount);
      await prisma.booking.update({
        where: { id: resolvedBooking.id },
        data: {
          balanceAmount: newBalance,
          ...(newBalance === 0 ? { status: "COMPLETED" } : {}),
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: "PAYMENT_COLLECTED",
        entity: "Payment",
        entityId: payment.id,
        details: `Collected payment of ₹${numericAmount.toLocaleString("en-IN")} via ${paymentMode} (Receipt: ${receiptNumber})`,
        performedBy: session.user.name || "Admin",
      },
    });

    await prisma.notification.create({
      data: {
        title: `Payment Received: ₹${numericAmount.toLocaleString("en-IN")}`,
        message: `Receipt ${receiptNumber} generated via ${paymentMode}${resolvedBooking ? ` for Plot ${resolvedBooking.plot.plotNumber}` : ""}`,
        type: "PAYMENT",
        link: "/admin/payments",
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      message: `Receipt ${receiptNumber} generated successfully!`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/payments error:", error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}
