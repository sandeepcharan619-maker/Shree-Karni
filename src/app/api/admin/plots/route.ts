import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function isAdmin(session: any): boolean {
  if (!session?.user) return false;
  const role = (session.user.role || "").toUpperCase();
  const username = (session.user.username || "").toLowerCase();
  const memberId = (session.user.memberId || "").toUpperCase();
  return role === "ADMIN" || username === "admin" || memberId === "SKRADMIN";
}

// GET: Fetch all plots with relations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const plots = await prisma.plot.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        project: { select: { id: true, name: true, location: true } },
        sale: { include: { soldBy: { select: { name: true, memberId: true } } } },
        customer: { select: { id: true, name: true, phone: true, customerId: true } },
        assignedAssociate: { select: { id: true, name: true, memberId: true } },
        bookings: {
          select: {
            id: true,
            bookingNumber: true,
            customerName: true,
            customerPhone: true,
            totalPlotAmount: true,
            bookingAmount: true,
            balanceAmount: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { plotNumber: "asc" },
    });

    return NextResponse.json(plots);
  } catch (error: any) {
    console.error("Plots GET error:", error);
    return NextResponse.json({ error: "Failed to fetch plots" }, { status: 500 });
  }
}

// POST: Create a new plot or bulk generate plots
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
    }

    const body = await req.json();

    // Check if bulk generation
    if (body.isBulk) {
      const {
        prefix = "VTK",
        startNumber = 1,
        count = 10,
        projectName = "Shree Karni Vatika Township",
        location = "Vatika, Jaipur",
        sizeGaj = 125,
        pricePerGaj = 11000,
        facing = "East",
        dimensions = "30 x 45",
        roadWidth = "30 Ft",
        sector = "Block A",
        projectId,
      } = body;

      const createdPlots = [];
      const numCount = parseInt(count);
      const startNum = parseInt(startNumber);
      const size = parseFloat(sizeGaj);
      const price = parseFloat(pricePerGaj);

      for (let i = 0; i < numCount; i++) {
        const currentNum = startNum + i;
        const plotNo = `${prefix.trim().toUpperCase()}-${String(currentNum).padStart(3, "0")}`;

        const existing = await prisma.plot.findUnique({ where: { plotNumber: plotNo } });
        if (!existing) {
          const plot = await prisma.plot.create({
            data: {
              plotNumber: plotNo,
              projectName: projectName.trim(),
              location: location.trim(),
              sizeGaj: size,
              pricePerGaj: price,
              totalPrice: size * price,
              status: "AVAILABLE",
              facing,
              dimensions,
              roadWidth,
              sector,
              projectId: projectId || null,
            },
          });
          createdPlots.push(plot);
        }
      }

      await prisma.activityLog.create({
        data: {
          action: "PLOTS_BULK_GENERATED",
          entity: "Plot",
          details: `Bulk created ${createdPlots.length} plots (${prefix}-${String(startNum).padStart(3, "0")} to ${prefix}-${String(startNum + numCount - 1).padStart(3, "0")}) in ${projectName}`,
          performedBy: session?.user?.name || "Admin",
        },
      });

      try {
        revalidatePath("/admin");
        revalidatePath("/admin/plots");
        revalidatePath("/dashboard/plots");
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Successfully generated ${createdPlots.length} plots!`,
        count: createdPlots.length,
      });
    }

    // Single Plot Creation
    const {
      plotNumber,
      projectName = "Shree Karni Vatika Township",
      location = "Vatika, Jaipur",
      sizeGaj,
      pricePerGaj,
      status = "AVAILABLE",
      facing = "East",
      dimensions = "30 x 45",
      roadWidth = "30 Ft",
      sector = "Block A",
      projectId,
    } = body;

    if (!plotNumber || !sizeGaj || !pricePerGaj) {
      return NextResponse.json(
        { error: "Plot number, size (GAJ), and rate per GAJ are required" },
        { status: 400 }
      );
    }

    const cleanPlotNumber = plotNumber.trim().toUpperCase();

    const existing = await prisma.plot.findFirst({
      where: { plotNumber: cleanPlotNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Plot number "${cleanPlotNumber}" already exists in the system` },
        { status: 400 }
      );
    }

    const size = parseFloat(sizeGaj);
    const price = parseFloat(pricePerGaj);

    if (isNaN(size) || size <= 0 || isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: "Size and Price must be positive valid numbers" },
        { status: 400 }
      );
    }

    const plot = await prisma.plot.create({
      data: {
        plotNumber: cleanPlotNumber,
        projectName: projectName ? projectName.trim() : "Shree Karni Vatika Township",
        location: location ? location.trim() : "Vatika, Jaipur",
        sizeGaj: size,
        pricePerGaj: price,
        totalPrice: size * price,
        status: status || "AVAILABLE",
        facing: facing || "East",
        dimensions: dimensions || "30 x 45",
        roadWidth: roadWidth || "30 Ft",
        sector: sector || "Block A",
        projectId: projectId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "PLOT_CREATED",
        entity: "Plot",
        entityId: plot.id,
        details: `Created plot ${plot.plotNumber} (${plot.sizeGaj} Gaj @ ₹${plot.pricePerGaj}/Gaj) in ${plot.projectName}`,
        performedBy: session?.user?.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      plot,
      message: `Plot ${plot.plotNumber} added successfully!`,
    });
  } catch (error: any) {
    console.error("Create plot error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Plot number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message || "Failed to create plot" }, { status: 500 });
  }
}

// PATCH: Update plot details, dimensions, facing, road width, price or status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      plotNumber,
      projectName,
      location,
      sizeGaj,
      pricePerGaj,
      totalPrice,
      status,
      facing,
      dimensions,
      roadWidth,
      sector,
      projectId,
      assignedAssociateId,
      buyerName,
      buyerPhone,
      soldById,
      saleAmount,
    } = body;

    if (!id && !plotNumber) {
      return NextResponse.json({ error: "Plot ID or Plot Number is required" }, { status: 400 });
    }

    const current = await prisma.plot.findFirst({
      where: {
        OR: [
          ...(id && !id.startsWith("local-") ? [{ id }] : []),
          ...(plotNumber ? [{ plotNumber: plotNumber.trim().toUpperCase() }] : []),
        ],
      },
      include: {
        sale: {
          include: {
            soldBy: { select: { id: true, name: true, memberId: true } },
          },
        },
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Plot not found in database" }, { status: 404 });
    }

    const updateData: any = {};

    if (plotNumber && plotNumber.trim()) {
      const cleanPlotNum = plotNumber.trim().toUpperCase();
      if (cleanPlotNum !== current.plotNumber) {
        const existingWithNum = await prisma.plot.findFirst({
          where: { plotNumber: cleanPlotNum, NOT: { id: current.id } },
        });
        if (existingWithNum) {
          return NextResponse.json(
            { error: `Plot number "${cleanPlotNum}" is already assigned to another plot.` },
            { status: 400 }
          );
        }
        updateData.plotNumber = cleanPlotNum;
      }
    }

    if (projectName !== undefined) updateData.projectName = projectName.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (facing !== undefined) updateData.facing = facing;
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (roadWidth !== undefined) updateData.roadWidth = roadWidth;
    if (sector !== undefined) updateData.sector = sector;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (assignedAssociateId !== undefined) updateData.assignedAssociateId = assignedAssociateId || null;

    const newSize = sizeGaj !== undefined && sizeGaj !== "" ? parseFloat(sizeGaj) : current.sizeGaj;
    const newPrice = pricePerGaj !== undefined && pricePerGaj !== "" ? parseFloat(pricePerGaj) : current.pricePerGaj;

    if (sizeGaj !== undefined) updateData.sizeGaj = newSize;
    if (pricePerGaj !== undefined) updateData.pricePerGaj = newPrice;

    if (totalPrice !== undefined && totalPrice !== "" && !isNaN(parseFloat(totalPrice))) {
      updateData.totalPrice = parseFloat(totalPrice);
    } else if (sizeGaj !== undefined || pricePerGaj !== undefined) {
      updateData.totalPrice = newSize * newPrice;
    }

    if (status) updateData.status = status;

    await prisma.plot.update({
      where: { id: current.id },
      data: updateData,
    });

    // Handle Sale record if marked as SOLD or customer details provided
    const effectiveStatus = status || current.status;
    const effectiveTotalPrice = updateData.totalPrice ?? current.totalPrice;

    if (effectiveStatus === "SOLD" || (buyerName && buyerName.trim())) {
      let finalSoldById = session?.user?.id || "";
      if (soldById) {
        const userFound = await prisma.user.findFirst({
          where: { OR: [{ id: soldById }, { memberId: soldById }] },
        });
        if (userFound) finalSoldById = userFound.id;
      } else if (current.sale?.soldById) {
        finalSoldById = current.sale.soldById;
      }

      const finalBuyerName = (buyerName || current.sale?.buyerName || "Buyer").trim();
      const finalBuyerPhone = (buyerPhone !== undefined ? buyerPhone : current.sale?.buyerPhone || "").trim();
      const finalSaleAmount =
        saleAmount !== undefined && saleAmount !== ""
          ? parseFloat(saleAmount)
          : current.sale?.saleAmount || effectiveTotalPrice;

      await prisma.sale.upsert({
        where: { plotId: current.id },
        create: {
          plotId: current.id,
          buyerName: finalBuyerName,
          buyerPhone: finalBuyerPhone,
          soldById: finalSoldById,
          saleAmount: finalSaleAmount,
        },
        update: {
          buyerName: finalBuyerName,
          buyerPhone: finalBuyerPhone,
          soldById: finalSoldById,
          saleAmount: finalSaleAmount,
        },
      });
    } else if (effectiveStatus === "AVAILABLE" && (!buyerName || !buyerName.trim())) {
      await prisma.sale.deleteMany({ where: { plotId: current.id } });
    }

    const updated = await prisma.plot.findUnique({
      where: { id: current.id },
      include: {
        project: { select: { id: true, name: true, location: true } },
        sale: { include: { soldBy: { select: { id: true, name: true, memberId: true } } } },
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
    });

    await prisma.activityLog.create({
      data: {
        action: "PLOT_UPDATED",
        entity: "Plot",
        entityId: current.id,
        details: `Updated plot ${updated?.plotNumber} (${updated?.status})`,
        performedBy: session?.user?.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Plot ${updated?.plotNumber || current.plotNumber} updated successfully`,
      plot: updated,
    });
  } catch (error: any) {
    console.error("Update plot error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update plot" }, { status: 500 });
  }
}

// DELETE: Delete a plot
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || req.nextUrl.searchParams.get("id");
    const plotNumber = body.plotNumber || req.nextUrl.searchParams.get("plotNumber");

    if (!id && !plotNumber) {
      return NextResponse.json({ error: "Plot ID or Plot Number is required" }, { status: 400 });
    }

    const target = await prisma.plot.findFirst({
      where: {
        OR: [
          ...(id && !id.startsWith("local-") ? [{ id }] : []),
          ...(plotNumber ? [{ plotNumber: plotNumber.trim().toUpperCase() }] : []),
        ],
      },
    });

    if (!target) {
      return NextResponse.json({ success: true, message: "Plot removed successfully" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.sale.deleteMany({ where: { plotId: target.id } });
      await tx.payment.deleteMany({ where: { plotId: target.id } });
      await tx.booking.deleteMany({ where: { plotId: target.id } });
      await tx.plot.delete({ where: { id: target.id } });
    });

    await prisma.activityLog.create({
      data: {
        action: "PLOT_DELETED",
        entity: "Plot",
        details: `Deleted plot ${target.plotNumber}`,
        performedBy: session?.user?.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Plot ${target.plotNumber} deleted successfully`,
    });
  } catch (error: any) {
    console.error("Delete plot error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete plot" }, { status: 500 });
  }
}

export { PATCH as PUT };

