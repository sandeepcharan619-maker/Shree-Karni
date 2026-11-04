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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const bookings = await prisma.booking.findMany({
      where: {
        ...(status && status !== "ALL" ? { status } : {}),
      },
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
            agreementStatus: true,
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
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("GET /api/admin/bookings error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch bookings" }, { status: 500 });
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
      plotId,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      associateId,
      bookingAmount,
      paymentMode = "UPI",
      transactionRef,
      bankName,
      notes,
    } = body;

    if (!plotId || !customerName || !customerPhone || !bookingAmount) {
      return NextResponse.json(
        { error: "Plot, Customer Name, Mobile Number, and Booking Amount are required" },
        { status: 400 }
      );
    }

    const plot = await prisma.plot.findUnique({ where: { id: plotId } });
    if (!plot) {
      return NextResponse.json({ error: "Selected plot not found" }, { status: 404 });
    }

    if (plot.status === "SOLD") {
      return NextResponse.json({ error: `Plot ${plot.plotNumber} is already SOLD` }, { status: 400 });
    }

    const numericBookingAmount = parseFloat(bookingAmount);
    const balanceAmount = Math.max(0, plot.totalPrice - numericBookingAmount);

    // 1. Resolve or Create Customer
    let finalCustomer = null;
    if (customerId) {
      finalCustomer = await prisma.customer.findUnique({ where: { id: customerId } });
    }
    if (!finalCustomer) {
      // Find by phone or generate new
      finalCustomer = await prisma.customer.findFirst({ where: { phone: customerPhone.trim() } });
      if (!finalCustomer) {
        const lastCust = await prisma.customer.findFirst({
          where: { customerId: { startsWith: "CUST-" } },
          orderBy: { customerId: "desc" },
        });
        let nextCustNum = 1001;
        if (lastCust && lastCust.customerId.startsWith("CUST-")) {
          const num = parseInt(lastCust.customerId.replace("CUST-", ""));
          if (!isNaN(num)) nextCustNum = num + 1;
        }

        finalCustomer = await prisma.customer.create({
          data: {
            customerId: `CUST-${nextCustNum}`,
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail ? customerEmail.trim() : null,
            address: customerAddress ? customerAddress.trim() : "Vatika, Jaipur",
            agreementStatus: "PENDING",
            assignedAssociateId: associateId || null,
          },
        });
      }
    }

    // 2. Generate Booking Number
    const lastBooking = await prisma.booking.findFirst({
      where: { bookingNumber: { startsWith: "SKR-BK-" } },
      orderBy: { bookingNumber: "desc" },
    });
    let nextBkNum = 1;
    if (lastBooking && lastBooking.bookingNumber) {
      const parts = lastBooking.bookingNumber.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextBkNum = num + 1;
    }
    const bookingNumber = `SKR-BK-2026-${String(nextBkNum).padStart(3, "0")}`;

    // 3. Create Booking
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        plotId: plot.id,
        customerId: finalCustomer.id,
        customerName: finalCustomer.name,
        customerPhone: finalCustomer.phone,
        customerEmail: finalCustomer.email,
        customerAddress: finalCustomer.address,
        associateId: associateId || null,
        totalPlotAmount: plot.totalPrice,
        bookingAmount: numericBookingAmount,
        balanceAmount,
        paymentMode: paymentMode || "UPI",
        transactionRef: transactionRef || null,
        status: "CONFIRMED",
        agreementStatus: "PENDING",
        approvedAt: new Date(),
        notes: notes || "Booking advance received",
      },
    });

    // 4. Update Plot Status to BOOKED and link customer & associate
    await prisma.plot.update({
      where: { id: plot.id },
      data: {
        status: "BOOKED",
        customerId: finalCustomer.id,
        assignedAssociateId: associateId || null,
      },
    });

    // 5. Generate Payment Receipt
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
        bookingId: booking.id,
        customerId: finalCustomer.id,
        plotId: plot.id,
        amount: numericBookingAmount,
        paymentType: "BOOKING_ADVANCE",
        paymentMode: paymentMode || "UPI",
        transactionRef: transactionRef || `TXN-${Date.now()}`,
        bankName: bankName || null,
        status: "SUCCESS",
        collectedById: associateId || session.user.id,
        remarks: `Booking advance for Plot ${plot.plotNumber} (${bookingNumber})`,
      },
    });

    // 6. Log Activity & Notification
    await prisma.activityLog.create({
      data: {
        action: "BOOKING_CREATED",
        entity: "Booking",
        entityId: booking.id,
        details: `Booking ${bookingNumber} created for Plot ${plot.plotNumber} by ${finalCustomer.name} (Advance ₹${numericBookingAmount.toLocaleString("en-IN")})`,
        performedBy: session.user.name || "Admin",
      },
    });

    await prisma.notification.create({
      data: {
        title: `New Booking: Plot ${plot.plotNumber}`,
        message: `${finalCustomer.name} booked Plot ${plot.plotNumber} (${plot.sizeGaj} Gaj). Advance: ₹${numericBookingAmount.toLocaleString("en-IN")}`,
        type: "BOOKING",
        link: "/admin/bookings",
      },
    });

    return NextResponse.json({
      success: true,
      booking,
      receiptNumber: payment.receiptNumber,
      message: `Booking ${bookingNumber} confirmed successfully!`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/bookings error:", error);
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, agreementStatus, cancelReason } = body;

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { plot: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Action 1: Cancel Booking
    if (action === "CANCEL") {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: cancelReason || "Cancelled by Admin",
        },
      });

      // Release plot back to AVAILABLE
      await prisma.plot.update({
        where: { id: booking.plotId },
        data: {
          status: "AVAILABLE",
          customerId: null,
          assignedAssociateId: null,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: "BOOKING_CANCELLED",
          entity: "Booking",
          entityId: id,
          details: `Cancelled booking ${booking.bookingNumber} for Plot ${booking.plot.plotNumber}. Plot released back to Available.`,
          performedBy: session.user.name || "Admin",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Booking ${booking.bookingNumber} cancelled and Plot ${booking.plot.plotNumber} marked as Available.`,
        booking: updated,
      });
    }

    // Action 2: Approve / Confirm Booking
    if (action === "APPROVE") {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          approvedAt: new Date(),
        },
      });

      await prisma.activityLog.create({
        data: {
          action: "BOOKING_APPROVED",
          entity: "Booking",
          entityId: id,
          details: `Approved booking ${booking.bookingNumber}`,
          performedBy: session.user.name || "Admin",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Booking ${booking.bookingNumber} approved successfully.`,
        booking: updated,
      });
    }

    // Action 3: Update Agreement or Registry status
    if (agreementStatus) {
      const updated = await prisma.booking.update({
        where: { id },
        data: { agreementStatus },
      });

      if (booking.customerId) {
        await prisma.customer.update({
          where: { id: booking.customerId },
          data: { agreementStatus },
        });
      }

      // If Registry Done, mark Plot as SOLD
      if (agreementStatus === "REGISTRY_DONE") {
        await prisma.plot.update({
          where: { id: booking.plotId },
          data: { status: "SOLD" },
        });

        // Also record in Sale table
        await prisma.sale.upsert({
          where: { plotId: booking.plotId },
          create: {
            plotId: booking.plotId,
            buyerName: booking.customerName,
            buyerPhone: booking.customerPhone,
            buyerEmail: booking.customerEmail,
            soldById: booking.associateId || session.user.id,
            saleAmount: booking.totalPlotAmount,
          },
          update: {
            buyerName: booking.customerName,
            buyerPhone: booking.customerPhone,
            saleAmount: booking.totalPlotAmount,
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          action: "AGREEMENT_STATUS_UPDATED",
          entity: "Booking",
          entityId: id,
          details: `Updated agreement status to ${agreementStatus} for booking ${booking.bookingNumber}`,
          performedBy: session.user.name || "Admin",
        },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/admin/bookings error:", error);
    return NextResponse.json({ error: error.message || "Failed to update booking" }, { status: 500 });
  }
}
