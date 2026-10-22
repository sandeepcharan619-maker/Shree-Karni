import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { visitorName, phone, plotInterest, feedback, status } = body;

    if (!visitorName || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    await prisma.visitor.create({
      data: {
        associateId: session.user.id,
        visitorName,
        phone,
        plotInterest: plotInterest || null,
        feedback: feedback || null,
        status: status || "VISITED",
      },
    });

    return NextResponse.json({ message: "Visitor added successfully" });
  } catch (error) {
    console.error("Visitor error:", error);
    return NextResponse.json({ error: "Failed to add visitor" }, { status: 500 });
  }
}
