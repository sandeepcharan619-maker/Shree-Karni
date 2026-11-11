import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// Helper: Normalize or derive a starting prefix for plots (e.g. "SKC-" or "ROYAL-")
function normalizePrefix(projectName: string, customPrefix?: string): string {
  if (customPrefix && customPrefix.trim()) {
    let p = customPrefix.trim().toUpperCase().replace(/\s+/g, "");
    if (!p.endsWith("-") && !p.endsWith("_") && !p.endsWith("/")) {
      p = `${p}-`;
    }
    return p;
  }
  const clean = projectName.replace(/township|city|phase|enclave|colony|residency/gi, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  let prefix = "";
  if (words.length >= 2) {
    prefix = words.map((w) => w[0].toUpperCase()).join("").slice(0, 4);
  } else if (words.length === 1 && words[0].length >= 3) {
    prefix = words[0].slice(0, 3).toUpperCase();
  }
  return prefix.length >= 2 ? `${prefix}-` : "SKC-";
}

// Helper: Create inventory plots for a project
async function createPlotsForProject(
  projectId: string,
  projectName: string,
  location: string,
  countToCreate: number,
  prefix: string,
  startSequence: number = 1,
  baseSizeGaj: number = 150,
  basePricePerGaj: number = 11500
) {
  if (countToCreate <= 0) return [];

  // Find all existing plot numbers with this prefix across DB to avoid duplicate unique key error
  const existing = await prisma.plot.findMany({
    where: {
      plotNumber: { startsWith: prefix },
    },
    select: { plotNumber: true },
  });
  const existingSet = new Set(existing.map((p) => p.plotNumber.toUpperCase()));

  const facings = ["East", "West", "North", "South", "Corner", "Park Facing"];
  const plotsData = [];
  let currentNum = startSequence;

  for (let i = 0; i < countToCreate; i++) {
    while (existingSet.has(`${prefix}${String(currentNum).padStart(3, "0")}`)) {
      currentNum++;
    }
    const plotNumber = `${prefix}${String(currentNum).padStart(3, "0")}`;
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
        plotPrefix: proj.plotPrefix || normalizePrefix(proj.name),
        baseRatePerGaj: proj.baseRatePerGaj || 11500,
        baseSizeGaj: proj.baseSizeGaj || 150,
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

// POST /api/admin/projects - Create a new real estate project & auto-add plots to inventory
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

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Project with this name already exists" }, { status: 400 });
    }

    const parsedAcreage = totalAcreage !== undefined && totalAcreage !== "" ? parseFloat(String(totalAcreage)) : 20.0;
    const parsedPlotsCount = totalPlotsCount !== undefined && totalPlotsCount !== "" ? parseInt(String(totalPlotsCount), 10) : 100;
    const parsedBaseRate = basePricePerGaj !== undefined && basePricePerGaj !== "" ? parseFloat(String(basePricePerGaj)) : 11500;
    const parsedBaseSize = baseSizeGaj !== undefined && baseSizeGaj !== "" ? parseFloat(String(baseSizeGaj)) : 150;

    const normalizedStartingPrefix = normalizePrefix(name.trim(), plotPrefix);

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        location: location?.trim() || "Vatika, Jaipur, Rajasthan",
        description: description?.trim() || "Residential plot township in Vatika, Jaipur",
        status: status || "ACTIVE",
        totalAcreage: !isNaN(parsedAcreage) ? parsedAcreage : 20.0,
        totalPlotsCount: !isNaN(parsedPlotsCount) ? parsedPlotsCount : 100,
        plotPrefix: normalizedStartingPrefix,
        baseRatePerGaj: !isNaN(parsedBaseRate) ? parsedBaseRate : 11500,
        baseSizeGaj: !isNaN(parsedBaseSize) ? parsedBaseSize : 150,
        imageUrl: imageUrl || "/website-bg.png",
        layoutMapUrl: layoutMapUrl || null,
      },
    });

    // Automatically create inventory plots for this project with the starting name
    let createdPlots: any[] = [];
    if (!isNaN(parsedPlotsCount) && parsedPlotsCount > 0) {
      createdPlots = await createPlotsForProject(
        project.id,
        project.name,
        project.location,
        parsedPlotsCount,
        normalizedStartingPrefix,
        1,
        parsedBaseSize,
        parsedBaseRate
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
        details: `Created project "${project.name}" in ${project.location} with ${createdPlots.length} inventory plots starting with "${normalizedStartingPrefix}"`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      project,
      plotsCreatedCount: createdPlots.length,
      message: `Project "${project.name}" created with ${createdPlots.length} plots (${normalizedStartingPrefix}001 - ${normalizedStartingPrefix}${String(createdPlots.length).padStart(3, "0")}) added to inventory!`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}

// PUT /api/admin/projects - Update an existing project & automatically sync inventory / rename plots
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

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // 1. Fetch current project from DB
    const oldProject = await prisma.project.findUnique({
      where: { id },
      include: { plots: true },
    });

    if (!oldProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const parsedAcreage = totalAcreage !== undefined && totalAcreage !== "" ? parseFloat(String(totalAcreage)) : undefined;
    const parsedPlotsCount = totalPlotsCount !== undefined && totalPlotsCount !== "" ? parseInt(String(totalPlotsCount), 10) : undefined;
    const parsedBaseRate = basePricePerGaj !== undefined && basePricePerGaj !== "" ? parseFloat(String(basePricePerGaj)) : undefined;
    const parsedBaseSize = baseSizeGaj !== undefined && baseSizeGaj !== "" ? parseFloat(String(baseSizeGaj)) : undefined;

    const newName = name ? name.trim() : oldProject.name;
    const newLocation = location ? location.trim() : oldProject.location;
    const newPrefix = plotPrefix ? normalizePrefix(newName, plotPrefix) : (oldProject.plotPrefix || normalizePrefix(newName));

    // 2. Update the Project database record
    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: newName,
        location: newLocation,
        description: description !== undefined ? description?.trim() || null : undefined,
        status: status || undefined,
        totalAcreage: parsedAcreage !== undefined && !isNaN(parsedAcreage) ? parsedAcreage : undefined,
        totalPlotsCount: parsedPlotsCount !== undefined && !isNaN(parsedPlotsCount) ? parsedPlotsCount : undefined,
        plotPrefix: newPrefix,
        baseRatePerGaj: parsedBaseRate !== undefined && !isNaN(parsedBaseRate) ? parsedBaseRate : undefined,
        baseSizeGaj: parsedBaseSize !== undefined && !isNaN(parsedBaseSize) ? parsedBaseSize : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        layoutMapUrl: layoutMapUrl !== undefined ? layoutMapUrl : undefined,
      },
    });

    // 3. AUTOMATICALLY SYNC INVENTORY:
    // A) Update projectName and location on all plots belonging to this project
    await prisma.plot.updateMany({
      where: {
        OR: [
          { projectId: updated.id },
          { projectName: oldProject.name },
        ],
      },
      data: {
        projectName: updated.name,
        location: updated.location,
        projectId: updated.id,
      },
    });

    // B) If plotPrefix / starting name was changed or renamed by admin:
    const oldPrefix = oldProject.plotPrefix || normalizePrefix(oldProject.name);
    const prefixChanged = newPrefix !== oldPrefix;
    let renamedCount = 0;

    if (prefixChanged) {
      const existingPlots = await prisma.plot.findMany({
        where: { projectId: updated.id },
        orderBy: { plotNumber: "asc" },
      });

      // 2-step rename to avoid unique constraint collisions during batch renaming:
      const tempTimestamp = Date.now();
      for (let idx = 0; idx < existingPlots.length; idx++) {
        const pl = existingPlots[idx];
        await prisma.plot.update({
          where: { id: pl.id },
          data: { plotNumber: `__TMP_${tempTimestamp}_${idx}_${pl.id.slice(-4)}` },
        });
      }

      for (let idx = 0; idx < existingPlots.length; idx++) {
        const pl = existingPlots[idx];
        const match = pl.plotNumber.match(/(\d+)$/);
        const seq = match ? parseInt(match[1], 10) : idx + 1;
        const newPlotNumber = `${newPrefix}${String(seq).padStart(3, "0")}`;
        await prisma.plot.update({
          where: { id: pl.id },
          data: { plotNumber: newPlotNumber },
        });
        renamedCount++;
      }
    }

    // C) If totalPlotsCount was adjusted:
    let additionalPlotsCount = 0;
    let removedPlotsCount = 0;

    if (parsedPlotsCount !== undefined && !isNaN(parsedPlotsCount) && parsedPlotsCount > 0) {
      const currentPlotsInDb = await prisma.plot.findMany({
        where: { projectId: updated.id },
        orderBy: { plotNumber: "asc" },
      });
      const currentCount = currentPlotsInDb.length;

      if (parsedPlotsCount > currentCount) {
        // Automatically create additional plots up to parsedPlotsCount
        const diff = parsedPlotsCount - currentCount;
        const newPlots = await createPlotsForProject(
          updated.id,
          updated.name,
          updated.location,
          diff,
          newPrefix,
          currentCount + 1,
          parsedBaseSize || updated.baseSizeGaj || 150,
          parsedBaseRate || updated.baseRatePerGaj || 11500
        );
        additionalPlotsCount = newPlots.length;
      } else if (parsedPlotsCount < currentCount) {
        // Safely remove only available (unbooked / unsold) plots beyond the new count
        const excess = currentCount - parsedPlotsCount;
        const availableExcess = await prisma.plot.findMany({
          where: {
            projectId: updated.id,
            status: "AVAILABLE",
            sale: null,
          },
          orderBy: { plotNumber: "desc" },
          take: excess,
        });

        if (availableExcess.length > 0) {
          await prisma.plot.deleteMany({
            where: { id: { in: availableExcess.map((p) => p.id) } },
          });
          removedPlotsCount = availableExcess.length;
        }
      }
    }

    // D) If base rate or base size was updated, update available inventory plots
    if (parsedBaseRate || parsedBaseSize) {
      const availPlots = await prisma.plot.findMany({
        where: { projectId: updated.id, status: "AVAILABLE" },
      });

      for (const pl of availPlots) {
        const sz = parsedBaseSize || pl.sizeGaj;
        const pr = parsedBaseRate || pl.pricePerGaj;
        await prisma.plot.update({
          where: { id: pl.id },
          data: {
            sizeGaj: sz,
            pricePerGaj: pr,
            totalPrice: sz * pr,
          },
        });
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

    const detailLog = [
      `Updated project "${updated.name}"`,
      prefixChanged ? `renamed ${renamedCount} plots to prefix "${newPrefix}"` : null,
      additionalPlotsCount > 0 ? `added ${additionalPlotsCount} new plots to inventory` : null,
      removedPlotsCount > 0 ? `trimmed ${removedPlotsCount} excess available plots` : null,
    ].filter(Boolean).join(", ");

    await prisma.activityLog.create({
      data: {
        action: "PROJECT_UPDATED",
        entity: "Project",
        entityId: updated.id,
        details: detailLog,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      project: updated,
      renamedCount,
      additionalPlotsCount,
      removedPlotsCount,
      message: `Project and inventory updated successfully! ${prefixChanged ? `Renamed plots to starting prefix "${newPrefix}". ` : ""}${additionalPlotsCount > 0 ? `Added ${additionalPlotsCount} new plots. ` : ""}`,
    });
  } catch (error: any) {
    console.error("PUT /api/admin/projects error:", error);
    return NextResponse.json({ error: error.message || "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/admin/projects - Delete project & safely handle plots
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
