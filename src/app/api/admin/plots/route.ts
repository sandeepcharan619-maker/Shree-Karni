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

    const plots = await prisma.plot.findMany({
      include: {
        sale: { include: { soldBy: { select: { name: true, memberId: true } } } },
      },
      orderBy: { plotNumber: "asc" },
    });

    return NextResponse.json(plots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plots" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plotNumber, projectName, location, sizeGaj, pricePerGaj, status } = body;

    if (!plotNumber || !location || !sizeGaj || !pricePerGaj) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const size = parseFloat(sizeGaj);
    const price = parseFloat(pricePerGaj);

    const plot = await prisma.plot.create({
      data: {
        plotNumber,
        projectName: projectName || "Shree Karni City",
        location,
        sizeGaj: size,
        pricePerGaj: price,
        totalPrice: size * price,
        status: status || "AVAILABLE",
      },
    });

    return NextResponse.json(plot);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Plot number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create plot" }, { status: 500 });
  }
}
