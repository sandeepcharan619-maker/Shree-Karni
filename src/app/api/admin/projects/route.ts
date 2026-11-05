import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// GET /api/admin/projects - Fetch all projects with plot count and sales
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      include: {
        plots: {
          select: {
            id: true,
            status: true,
            sizeGaj: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = projects.map((proj) => {
      const soldPlots = proj.plots.filter((p) => p.status === "SOLD").length;
      const bookedPlots = proj.plots.filter((p) => p.status === "BOOKED" || p.status === "RESERVED").length;
      const totalPlots =
        proj.totalPlotsCount !== null && proj.totalPlotsCount !== undefined
          ? proj.totalPlotsCount
          : proj.plots.length;
      const availablePlots = Math.max(0, totalPlots - (soldPlots + bookedPlots));
      const totalInventoryValue = proj.plots.reduce((sum, p) => sum + p.totalPrice, 0);
      const soldSalesValue = proj.plots
        .filter((p) => p.status === "SOLD")
        .reduce((sum, p) => sum + p.totalPrice, 0);

      return {
        ...proj,
        totalPlotsCount: totalPlots,
        plotsCount: totalPlots,
        availablePlots,
        bookedPlots,
        soldPlots,
        totalInventoryValue,
        soldSalesValue,
      };
    });

    return NextResponse.json({ projects: enriched }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (error: any) {
    console.error("GET /api/admin/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/admin/projects - Create a new real estate project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, location, description, status, totalAcreage, totalPlotsCount, imageUrl, layoutMapUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Project with this name already exists" }, { status: 400 });
    }

    const parsedAcreage = totalAcreage !== undefined && totalAcreage !== "" ? parseFloat(String(totalAcreage)) : 20.0;
    const parsedPlotsCount = totalPlotsCount !== undefined && totalPlotsCount !== "" ? parseInt(String(totalPlotsCount), 10) : 100;

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        location: location?.trim() || "Vatika, Jaipur, Rajasthan",
        description: description?.trim() || "Residential plot township in Vatika, Jaipur",
        status: status || "ACTIVE",
        totalAcreage: !isNaN(parsedAcreage) ? parsedAcreage : 20.0,
        totalPlotsCount: !isNaN(parsedPlotsCount) ? parsedPlotsCount : 100,
        imageUrl: imageUrl || "/website-bg.png",
        layoutMapUrl: layoutMapUrl || null,
      },
    });

    try {
      revalidatePath("/admin/projects");
      revalidatePath("/dashboard/projects");
      revalidatePath("/admin");
      revalidatePath("/dashboard");
    } catch {}

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: "PROJECT_CREATED",
        entity: "Project",
        entityId: project.id,
        details: `Created project "${project.name}" in ${project.location}`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("POST /api/admin/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}

// PUT /api/admin/projects - Update an existing project
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, location, description, status, totalAcreage, totalPlotsCount, imageUrl, layoutMapUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const parsedAcreage = totalAcreage !== undefined && totalAcreage !== "" ? parseFloat(String(totalAcreage)) : undefined;
    const parsedPlotsCount = totalPlotsCount !== undefined && totalPlotsCount !== "" ? parseInt(String(totalPlotsCount), 10) : undefined;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(location ? { location: location.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(status ? { status } : {}),
        ...(parsedAcreage !== undefined && !isNaN(parsedAcreage) ? { totalAcreage: parsedAcreage } : {}),
        ...(parsedPlotsCount !== undefined && !isNaN(parsedPlotsCount) ? { totalPlotsCount: parsedPlotsCount } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(layoutMapUrl !== undefined ? { layoutMapUrl } : {}),
      },
    });

    try {
      revalidatePath("/admin/projects");
      revalidatePath("/dashboard/projects");
      revalidatePath("/admin");
      revalidatePath("/dashboard");
    } catch {}

    await prisma.activityLog.create({
      data: {
        action: "PROJECT_UPDATED",
        entity: "Project",
        entityId: updated.id,
        details: `Updated project "${updated.name}" (Total Plots: ${updated.totalPlotsCount})`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/admin/projects - Delete project
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const plotCount = await prisma.plot.count({ where: { projectId: id } });
    if (plotCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete project with ${plotCount} existing plots. Delete or reassign plots first.` },
        { status: 400 }
      );
    }

    const deleted = await prisma.project.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: "PROJECT_DELETED",
        entity: "Project",
        entityId: id,
        details: `Deleted project "${deleted.name}"`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete project" }, { status: 500 });
  }
}
