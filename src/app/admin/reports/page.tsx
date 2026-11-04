import { prisma } from "@/lib/prisma";
import AdminReportsManager from "@/components/admin/AdminReportsManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminReportsPage() {
  const [projects, plots, associates, customers, incentives] = await Promise.all([
    prisma.project.findMany({
      include: {
        plots: { select: { status: true, totalPrice: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.plot.findMany({
      orderBy: { plotNumber: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      include: {
        sales: { include: { plot: true } },
        referrals: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      include: {
        bookings: { select: { plotId: true, totalPlotAmount: true } },
        payments: { select: { amount: true, status: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.incentive.findMany({
      include: {
        associate: { select: { name: true, memberId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 1. Project Sales Data
  const projectSales = projects.map((p) => {
    const totalPlots = p.plots.length;
    const available = p.plots.filter((pl) => pl.status === "AVAILABLE").length;
    const booked = p.plots.filter((pl) => pl.status === "BOOKED" || pl.status === "RESERVED").length;
    const sold = p.plots.filter((pl) => pl.status === "SOLD").length;
    const salesVal = p.plots.filter((pl) => pl.status === "SOLD").reduce((s, pl) => s + pl.totalPrice, 0);

    return {
      "Project Name": p.name,
      Location: p.location,
      Acreage: `${p.totalAcreage || 20} Acres`,
      "Total Plots": totalPlots,
      "Available Plots": available,
      "Booked Plots": booked,
      "Sold Plots": sold,
      "Sales Value": `₹ ${salesVal.toLocaleString("en-IN")}`,
    };
  });

  // 2. Plot Inventory Data
  const plotInventory = plots.map((p) => ({
    "Plot Number": p.plotNumber,
    Project: p.projectName,
    "Size (GAJ)": p.sizeGaj,
    "Rate / GAJ": `₹ ${p.pricePerGaj.toLocaleString("en-IN")}`,
    "Total Price": `₹ ${p.totalPrice.toLocaleString("en-IN")}`,
    Facing: p.facing || "East",
    "Road Width": p.roadWidth || "30 Ft",
    Status: p.status,
  }));

  // 3. Associate Sales Leaderboard
  const associateSales = associates.map((a) => {
    const plotsSoldCount = a.sales.length;
    const totalGaj = a.sales.reduce((sum, s) => sum + (s.plot?.sizeGaj || 0), 0);
    const totalBusiness = a.sales.reduce((sum, s) => sum + s.saleAmount, 0);

    return {
      "Member ID": a.memberId,
      Name: a.name,
      Rank: a.rank,
      "Plots Sold": plotsSoldCount,
      "Sales Volume (GAJ)": `${totalGaj} Gaj`,
      "Total Business": `₹ ${totalBusiness.toLocaleString("en-IN")}`,
      "Direct Downline": a.referrals.length,
      "Wallet Balance": `₹ ${a.walletBalance.toLocaleString("en-IN")}`,
    };
  });

  // 4. Customer Ledger
  const customerLedger = customers.map((c) => {
    const totalAmount = c.bookings.reduce((sum, b) => sum + b.totalPlotAmount, 0);
    const paidAmount = c.payments.reduce((sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0), 0);
    const outstanding = Math.max(0, totalAmount - paidAmount);

    return {
      "Customer ID": c.customerId,
      Name: c.name,
      Mobile: c.phone,
      "Booked Plots": c.bookings.length,
      "Total Amount": `₹ ${totalAmount.toLocaleString("en-IN")}`,
      "Paid Amount": `₹ ${paidAmount.toLocaleString("en-IN")}`,
      "Outstanding Balance": `₹ ${outstanding.toLocaleString("en-IN")}`,
      "Registry Status": c.agreementStatus,
    };
  });

  // 5. Commission Statements
  const commissionStatements = incentives.map((i) => ({
    "Associate Name": i.associate.name,
    "Member ID": i.associate.memberId,
    Type: i.type,
    Amount: `₹ ${i.amount.toLocaleString("en-IN")}`,
    Status: i.status,
    Date: new Date(i.createdAt).toLocaleDateString("en-IN"),
  }));

  return (
    <AdminReportsManager
      projectSales={projectSales}
      plotInventory={plotInventory}
      associateSales={associateSales}
      customerLedger={customerLedger}
      commissionStatements={commissionStatements}
    />
  );
}
