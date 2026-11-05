import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

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

    return NextResponse.json({ customers: enriched });
  } catch (error: any) {
    console.error("GET /api/admin/customers error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, address, panNumber, aadhaarNumber, agreementStatus, assignedAssociateId, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Customer Name and Mobile Number are required" }, { status: 400 });
    }

    // Auto-generate Customer ID: CUST-100X
    const lastCust = await prisma.customer.findFirst({
      where: { customerId: { startsWith: "CUST-" } },
      orderBy: { customerId: "desc" },
    });
    let nextNum = 1001;
    if (lastCust && lastCust.customerId.startsWith("CUST-")) {
      const num = parseInt(lastCust.customerId.replace("CUST-", ""));
      if (!isNaN(num)) nextNum = num + 1;
    }
    const customerId = `CUST-${nextNum}`;

    const customer = await prisma.customer.create({
      data: {
        customerId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : "Vatika, Jaipur",
        panNumber: panNumber ? panNumber.trim().toUpperCase() : null,
        aadhaarNumber: aadhaarNumber ? aadhaarNumber.trim() : null,
        agreementStatus: agreementStatus || "PENDING",
        assignedAssociateId: assignedAssociateId || null,
        notes: notes || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "CUSTOMER_REGISTERED",
        entity: "Customer",
        entityId: customer.id,
        details: `Registered customer ${customer.name} (${customer.customerId}) - ${customer.phone}`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error("POST /api/admin/customers error:", error);
    return NextResponse.json({ error: error.message || "Failed to create customer" }, { status: 500 });
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
      name,
      phone,
      email,
      address,
      panNumber,
      aadhaarNumber,
      agreementStatus,
      registryDate,
      assignedAssociateId,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(email !== undefined ? { email: email ? email.trim() : null } : {}),
        ...(address !== undefined ? { address: address ? address.trim() : null } : {}),
        ...(panNumber !== undefined ? { panNumber: panNumber ? panNumber.trim().toUpperCase() : null } : {}),
        ...(aadhaarNumber !== undefined ? { aadhaarNumber: aadhaarNumber ? aadhaarNumber.trim() : null } : {}),
        ...(agreementStatus ? { agreementStatus } : {}),
        ...(registryDate ? { registryDate: new Date(registryDate) } : {}),
        ...(assignedAssociateId !== undefined ? { assignedAssociateId: assignedAssociateId || null } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
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
    });

    // Also sync customer name/phone to any active bookings for this customer
    if (name || phone) {
      await prisma.booking.updateMany({
        where: { customerId: updated.id },
        data: {
          ...(name ? { customerName: name.trim() } : {}),
          ...(phone ? { customerPhone: phone.trim() } : {}),
          ...(email !== undefined ? { customerEmail: email ? email.trim() : null } : {}),
          ...(address !== undefined ? { customerAddress: address ? address.trim() : null } : {}),
        },
      });
    }

    const totalBookedValue = updated.bookings.reduce((sum, b) => sum + b.totalPlotAmount, 0);
    const totalPaid = updated.payments.reduce((sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0), 0);
    const totalOutstanding = Math.max(0, totalBookedValue - totalPaid);

    const enriched = {
      ...updated,
      totalBookedValue,
      totalPaid,
      totalOutstanding,
    };

    await prisma.activityLog.create({
      data: {
        action: "CUSTOMER_UPDATED",
        entity: "Customer",
        entityId: updated.id,
        details: `Updated customer details for ${updated.name} (${updated.customerId})`,
        performedBy: session.user.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin/customers");
      revalidatePath("/admin/bookings");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json({ success: true, customer: enriched });
  } catch (error: any) {
    console.error("PUT /api/admin/customers error:", error);
    return NextResponse.json({ error: error.message || "Failed to update customer" }, { status: 500 });
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
    const customerId = body.customerId || req.nextUrl.searchParams.get("customerId");

    if (!id && !customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const target = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(customerId ? [{ customerId: customerId.trim() }] : []),
        ],
      },
    });

    if (!target) {
      return NextResponse.json({ success: true, message: "Customer already removed" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Unlink any plots assigned to this customer so plot records are preserved
      await tx.plot.updateMany({
        where: { customerId: target.id },
        data: { customerId: null },
      });

      // 2. Delete customer payment receipts
      await tx.payment.deleteMany({
        where: { customerId: target.id },
      });

      // 3. Delete customer bookings and release any plots that were booked
      const bookings = await tx.booking.findMany({
        where: { customerId: target.id },
        select: { id: true, plotId: true },
      });

      for (const b of bookings) {
        if (b.plotId) {
          const plot = await tx.plot.findUnique({ where: { id: b.plotId } });
          if (plot && plot.status !== "SOLD") {
            await tx.plot.update({
              where: { id: b.plotId },
              data: { status: "AVAILABLE", customerId: null, assignedAssociateId: null },
            });
          }
        }
      }

      await tx.booking.deleteMany({
        where: { customerId: target.id },
      });

      // 4. Delete customer record
      await tx.customer.delete({
        where: { id: target.id },
      });
    });

    await prisma.activityLog.create({
      data: {
        action: "CUSTOMER_DELETED",
        entity: "Customer",
        entityId: target.id,
        details: `Deleted customer ${target.name} (${target.customerId})`,
        performedBy: session.user.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin/customers");
      revalidatePath("/admin/bookings");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Customer "${target.name}" (${target.customerId}) deleted successfully`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/customers error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete customer" }, { status: 500 });
  }
}

export { PUT as PATCH };

