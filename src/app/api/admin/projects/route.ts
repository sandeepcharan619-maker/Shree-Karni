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

function derivePrefix(projectName: string, customPrefix?: string): string {
  if (customPrefix && customPrefix.trim()) {
    return customPrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  const clean = projectName.replace(/township|city|phase|enclave|colony|residency/gi, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  let prefix = "";
  if (words.length >= 2) {
    prefix = words.map((w) => w[0].toUpperCase()).join("").slice(0, 4);
  } else if (words.length === 1 && words[0].length >= 3) {
    prefix = words[0].slice(0, 3).toUpperCase();
  }
  return prefix.length >= 2 ? prefix : "SKP";
}

async function createPlotsForProject(
  projectId: string,
  projectName: string,
  location: string,
  countToCreate: number,
  customPrefix?: string,
  baseSizeGaj: number = 150,
  basePricePerGaj: number = 11500
) {
  if (countToCreate <= 0) return [];

  const prefix = derivePrefix(projectName, customPrefix);

  // Find all existing plot numbers with this prefix to avoid collisions
  const existing = await prisma.plot.findMany({
    where: {
      plotNumber: { startsWith: `${prefix}-` },
    },
    select: { plotNumber: true },
  });
  const existingSet = new Set(existing.map((p) => p.plotNumber.toUpperCase()));

  const facings = ["East", "West", "North", "South", "Corner", "Park Facing"];
  const plotsData = [];
  let currentNum = 1;

  for (let i = 0; i < countToCreate; i++) {
    while (existingSet.has(`${prefix}-${String(currentNum).padStart(3, "0")}`)) {
      currentNum++;
    }
    const plotNumber = `${prefix}-${String(currentNum).padStart(3, "0")}`;
    existingSet.add(plotNumber);
    currentNum++;

    const size = parseFloat(String(baseSizeGaj)) || 150;
    const price = parseFloat(String(basePricePerGaj)) || 11500;
    const sector = `Block ${String.fromCharCode(65 + (Math.floor(i / 25) % 4))}`;

    plotsData.push({
      plotNumber,
      projectName,
      location,
      sizeGaj: size,
      pricePerGaj: price,
      totalPrice: size * price,
      status: "AVAILABLE",
      facing: facings[i % facings.length],
      dimensions: "30 x 45",
      roadWidth: i % 5 === 0 ? "40 Ft" : "30 Ft",
      sector,
      projectId,
    });
  }

  if (plotsData.length > 0) {
    await prisma.plot.createMany({
      data: plotsData,
    });
  }

  return plotsData;
}

// POST /api/admin/projects - Create a new real estate project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      location,
      description,
      status,
      totalAcreage,
      totalPlotsCount,
      imageUrl,
      layoutMapUrl,
      plotPrefix,
      baseSizeGaj,
      basePricePerGaj,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { name: name.trim() } });
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

    // Automatically create inventory plots for this project
    let createdPlots: any[] = [];
    if (!isNaN(parsedPlotsCount) && parsedPlotsCount > 0) {
      createdPlots = await createPlotsForProject(
        project.id,
        project.name,
        project.location,
        parsedPlotsCount,
        plotPrefix,
        baseSizeGaj || 150,
        basePricePerGaj || 11500
      );
    }

    try {
      revalidatePath("/admin/projects");
      revalidatePath("/dashboard/projects");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/admin");
      revalidatePath("/dashboard");
    } catch {}

    // Log Activity
    await prisma.activityLog.create({
      data: {
        action: "PROJECT_CREATED",
        entity: "Project",
        entityId: project.id,
        details: `Created project "${project.name}" in ${project.location} with ${createdPlots.length} automated inventory plots`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      project,
      plotsCreatedCount: createdPlots.length,
      message: `Project "${project.name}" created with ${createdPlots.length} plots added to inventory!`,
    });
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

    // If totalPlotsCount was increased, automatically generate additional missing plots
    let additionalPlotsCount = 0;
    if (parsedPlotsCount !== undefined && !isNaN(parsedPlotsCount) && parsedPlotsCount > 0) {
      const currentPlotCount = await prisma.plot.count({ where: { projectId: updated.id } });
      if (parsedPlotsCount > currentPlotCount) {
        const diff = parsedPlotsCount - currentPlotCount;
        const newPlots = await createPlotsForProject(
          updated.id,
          updated.name,
          updated.location,
          diff,
          body.plotPrefix,
          body.baseSizeGaj || 150,
          body.basePricePerGaj || 11500
        );
        additionalPlotsCount = newPlots.length;
      }
    }

    try {
      revalidatePath("/admin/projects");
      revalidatePath("/dashboard/projects");
      revalidatePath("/admin/plots");
      revalidatePath("/dashboard/plots");
      revalidatePath("/admin");
      revalidatePath("/dashboard");
    } catch {}

    await prisma.activityLog.create({
      data: {
        action: "PROJECT_UPDATED",
        entity: "Project",
        entityId: updated.id,
        details: `Updated project "${updated.name}" (Total Plots: ${updated.totalPlotsCount}${additionalPlotsCount > 0 ? `, added ${additionalPlotsCount} new plots to inventory` : ""})`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      project: updated,
      additionalPlotsCount,
      message: `Project updated successfully${additionalPlotsCount > 0 ? ` and ${additionalPlotsCount} additional plots generated in inventory` : ""}.`,
    });
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

    // Safely unlink any existing plots before deleting project so plots are preserved
    const plotCount = await prisma.plot.count({ where: { projectId: id } });
    if (plotCount > 0) {
      await prisma.plot.updateMany({
        where: { projectId: id },
        data: { projectId: null },
      });
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
