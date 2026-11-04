import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      const totalPlots = proj.plots.length;
      const availablePlots = proj.plots.filter((p) => p.status === "AVAILABLE").length;
      const bookedPlots = proj.plots.filter((p) => p.status === "BOOKED" || p.status === "RESERVED").length;
      const soldPlots = proj.plots.filter((p) => p.status === "SOLD").length;
      const totalInventoryValue = proj.plots.reduce((sum, p) => sum + p.totalPrice, 0);
      const soldSalesValue = proj.plots
        .filter((p) => p.status === "SOLD")
        .reduce((sum, p) => sum + p.totalPrice, 0);

      return {
        ...proj,
        plotsCount: totalPlots,
        availablePlots,
        bookedPlots,
        soldPlots,
        totalInventoryValue,
        soldSalesValue,
      };
    });

    return NextResponse.json({ projects: enriched });
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

    const project = await prisma.project.create({
      data: {
        name,
        location: location || "Vatika, Jaipur, Rajasthan",
        description: description || "Residential plot township in Vatika, Jaipur",
        status: status || "ACTIVE",
        totalAcreage: totalAcreage ? parseFloat(totalAcreage) : 20.0,
        totalPlotsCount: totalPlotsCount ? parseInt(totalPlotsCount) : 100,
        imageUrl: imageUrl || "/website-bg.png",
        layoutMapUrl: layoutMapUrl || null,
      },
    });

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

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(location ? { location } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status ? { status } : {}),
        ...(totalAcreage !== undefined ? { totalAcreage: parseFloat(totalAcreage) } : {}),
        ...(totalPlotsCount !== undefined ? { totalPlotsCount: parseInt(totalPlotsCount) } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(layoutMapUrl !== undefined ? { layoutMapUrl } : {}),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "PROJECT_UPDATED",
        entity: "Project",
        entityId: updated.id,
        details: `Updated project "${updated.name}"`,
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
