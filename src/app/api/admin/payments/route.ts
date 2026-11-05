import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/payments");
      revalidatePath("/admin/bookings");
      revalidatePath("/admin/customers");
    } catch {}

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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      amount,
      paymentType,
      paymentMode,
      transactionRef,
      bankName,
      status,
      remarks,
      receiptDate,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const numericAmount = amount !== undefined ? parseFloat(amount) : existingPayment.amount;
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        amount: numericAmount,
        paymentType: paymentType || existingPayment.paymentType,
        paymentMode: paymentMode || existingPayment.paymentMode,
        transactionRef: transactionRef !== undefined ? transactionRef : existingPayment.transactionRef,
        bankName: bankName !== undefined ? bankName : existingPayment.bankName,
        status: status || existingPayment.status,
        remarks: remarks !== undefined ? remarks : existingPayment.remarks,
        receiptDate: receiptDate ? new Date(receiptDate) : existingPayment.receiptDate,
      },
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
    });

    // If associated with a booking, recalculate the booking's remaining balance
    const bookingId = existingPayment.bookingId;
    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking) {
        const successfulPayments = await prisma.payment.findMany({
          where: { bookingId, status: "SUCCESS" },
          select: { amount: true },
        });
        const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
        const newBalance = Math.max(0, booking.totalPlotAmount - totalPaid);
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            balanceAmount: newBalance,
            status: newBalance === 0 ? "COMPLETED" : (booking.status === "COMPLETED" ? "CONFIRMED" : booking.status),
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        action: "PAYMENT_UPDATED",
        entity: "Payment",
        entityId: updated.id,
        details: `Updated payment receipt ${updated.receiptNumber}: ₹${updated.amount.toLocaleString("en-IN")} (${updated.paymentMode}, ${updated.status})`,
        performedBy: session.user.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/payments");
      revalidatePath("/admin/bookings");
      revalidatePath("/admin/customers");
    } catch {}

    return NextResponse.json({
      success: true,
      payment: updated,
      message: `Payment receipt ${updated.receiptNumber} updated successfully.`,
    });
  } catch (error: any) {
    console.error("PUT /api/admin/payments error:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!payment) {
      return NextResponse.json({ success: true, message: "Payment already removed" });
    }

    const bookingId = payment.bookingId;

    // Delete the payment record
    await prisma.payment.delete({ where: { id } });

    // If associated with a booking, adjust the booking's remaining balance
    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking) {
        const remainingSuccessPayments = await prisma.payment.findMany({
          where: { bookingId, status: "SUCCESS" },
          select: { amount: true },
        });
        const totalPaid = remainingSuccessPayments.reduce((sum, p) => sum + p.amount, 0);
        const newBalance = Math.max(0, booking.totalPlotAmount - totalPaid);
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            balanceAmount: newBalance,
            status: newBalance === 0 ? "COMPLETED" : (booking.status === "COMPLETED" ? "CONFIRMED" : booking.status),
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        action: "PAYMENT_DELETED",
        entity: "Payment",
        entityId: payment.id,
        details: `Deleted payment receipt ${payment.receiptNumber} of ₹${payment.amount.toLocaleString("en-IN")}`,
        performedBy: session.user.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/payments");
      revalidatePath("/admin/bookings");
      revalidatePath("/admin/customers");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Payment receipt ${payment.receiptNumber} deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/payments error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete payment" }, { status: 500 });
  }
}

export { PUT as PATCH };
