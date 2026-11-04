import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { id, name, phone, email, address, panNumber, aadhaarNumber, agreementStatus, registryDate, notes } = body;

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
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "CUSTOMER_UPDATED",
        entity: "Customer",
        entityId: updated.id,
        details: `Updated customer details for ${updated.name} (${updated.customerId})`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/customers error:", error);
    return NextResponse.json({ error: error.message || "Failed to update customer" }, { status: 500 });
  }
}
