import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInquiryNotification } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, requirement, message } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Full Name and Phone Number are required." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanRequirement = requirement ? requirement.trim() : "100 - 150 GAJ Plot";
    const cleanMessage = message ? message.trim() : "";

    // 1. Save as a Lead in the database so admin and associates can also see it in the dashboard
    try {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (admin) {
        await prisma.lead.create({
          data: {
            associateId: admin.id,
            name: cleanName,
            phone: cleanPhone,
            source: "Website Contact Form",
            plotInterest: cleanRequirement,
            notes: cleanMessage ? `Requirement: ${cleanRequirement} | Message: ${cleanMessage}` : `Requirement: ${cleanRequirement}`,
            status: "NEW",
          },
        });
      }
    } catch (dbErr) {
      console.warn("Could not save lead to database:", dbErr);
    }

    // 2. Dispatch email notification to realesateshreekarni@gmail.com
    const mailResult = await sendInquiryNotification({
      name: cleanName,
      phone: cleanPhone,
      requirement: cleanRequirement,
      message: cleanMessage,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for contacting Shree Karni Real Estate. We have received your inquiry and our team has been notified.",
      mailSent: mailResult.success,
    });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process inquiry. Please try again." },
      { status: 500 }
    );
  }
}
