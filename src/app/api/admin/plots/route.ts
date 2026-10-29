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

// GET: Fetch all plots (available to admin and logged-in associates)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plots = await prisma.plot.findMany({
      include: {
        sale: { include: { soldBy: { select: { name: true, memberId: true } } } },
      },
      orderBy: { plotNumber: "asc" },
    });

    return NextResponse.json(plots);
  } catch (error: any) {
    console.error("Plots GET error:", error);
    return NextResponse.json({ error: "Failed to fetch plots" }, { status: 500 });
  }
}

// POST: Create a new plot
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
    }

    const body = await req.json();
    const { plotNumber, projectName, location, sizeGaj, pricePerGaj, status = "AVAILABLE" } = body;

    if (!plotNumber || !location || !sizeGaj || !pricePerGaj) {
      return NextResponse.json(
        { error: "Plot number, location, size (GAJ), and price per GAJ are required" },
        { status: 400 }
      );
    }

    const cleanPlotNumber = plotNumber.trim().toUpperCase();

    // Check if plot number already exists
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
        projectName: projectName ? projectName.trim() : "Shree Karni City",
        location: location.trim(),
        sizeGaj: size,
        pricePerGaj: price,
        totalPrice: size * price,
        status: status || "AVAILABLE",
      },
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidate cache error:", e);
    }

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

// PATCH: Update plot status, price or details
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
      buyerName,
      buyerPhone,
      soldById,
      saleAmount,
    } = body;

    if (!id && !plotNumber) {
      return NextResponse.json({ error: "Plot ID or Plot Number is required" }, { status: 400 });
    }

    // Find the plot by ID or by Plot Number
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

    // 1. Plot Number update with duplicate check
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

    // 2. Project name & Location
    if (projectName !== undefined) updateData.projectName = projectName.trim();
    if (location !== undefined) updateData.location = location.trim();

    // 3. Size, Price and Total Price
    const newSize = sizeGaj !== undefined && sizeGaj !== "" ? parseFloat(sizeGaj) : current.sizeGaj;
    const newPrice = pricePerGaj !== undefined && pricePerGaj !== "" ? parseFloat(pricePerGaj) : current.pricePerGaj;
    
    if (sizeGaj !== undefined) updateData.sizeGaj = newSize;
    if (pricePerGaj !== undefined) updateData.pricePerGaj = newPrice;

    if (totalPrice !== undefined && totalPrice !== "" && !isNaN(parseFloat(totalPrice))) {
      updateData.totalPrice = parseFloat(totalPrice);
    } else if (sizeGaj !== undefined || pricePerGaj !== undefined) {
      updateData.totalPrice = newSize * newPrice;
    }

    // 4. Status
    if (status) updateData.status = status;

    // Update the plot record
    await prisma.plot.update({
      where: { id: current.id },
      data: updateData,
    });

    // 5. Manage Sale (Sold To / Associate)
    const effectiveStatus = status || current.status;
    const effectiveTotalPrice = updateData.totalPrice ?? current.totalPrice;

    if (effectiveStatus === "SOLD" || (buyerName && buyerName.trim())) {
      // Find associate user if provided
      let finalSoldById = session?.user?.id || "";
      if (soldById) {
        const userFound = await prisma.user.findFirst({
          where: { OR: [{ id: soldById }, { memberId: soldById }] },
        });
        if (userFound) {
          finalSoldById = userFound.id;
        }
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
      // If reset to AVAILABLE and no buyer specified, remove any previous sale
      await prisma.sale.deleteMany({ where: { plotId: current.id } });
    }

    // Retrieve full updated record
    const updated = await prisma.plot.findUnique({
      where: { id: current.id },
      include: {
        sale: {
          include: {
            soldBy: { select: { id: true, name: true, memberId: true } },
          },
        },
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
      // Delete any associated sales record for this plot
      await tx.sale.deleteMany({ where: { plotId: target.id } });
      // Delete the plot
      await tx.plot.delete({ where: { id: target.id } });
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
