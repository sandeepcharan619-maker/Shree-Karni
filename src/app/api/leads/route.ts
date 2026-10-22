import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, source, plotInterest, notes, status } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    await prisma.lead.create({
      data: {
        associateId: session.user.id,
        name,
        phone,
        email: email || null,
        source: source || null,
        plotInterest: plotInterest || null,
        notes: notes || null,
        status: status || "NEW",
      },
    });

    return NextResponse.json({ message: "Lead added successfully" });
  } catch (error) {
    console.error("Lead error:", error);
    return NextResponse.json({ error: "Failed to add lead" }, { status: 500 });
  }
}
