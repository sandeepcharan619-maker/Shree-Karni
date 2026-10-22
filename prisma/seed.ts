import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const associatePassword = await bcrypt.hash("password123", 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Admin User",
      email: "admin@shreekarnirealestate.com",
      phone: "9999999999",
      role: "ADMIN",
      rank: "Administrator",
      memberId: "SKRADMIN",
      walletBalance: 0,
    },
  });

  // Create Associates
  const associate1 = await prisma.user.upsert({
    where: { username: "rajesh.sharma" },
    update: {},
    create: {
      username: "rajesh.sharma",
      password: associatePassword,
      name: "Rajesh Sharma",
      email: "rajesh@example.com",
      phone: "9876543210",
      role: "ASSOCIATE",
      rank: "Client Adviser",
      memberId: "SKR00001",
      walletBalance: 15000,
    },
  });

  const associate2 = await prisma.user.upsert({
    where: { username: "priya.verma" },
    update: {},
    create: {
      username: "priya.verma",
      password: associatePassword,
      name: "Priya Verma",
      email: "priya@example.com",
      phone: "9876543211",
      role: "ASSOCIATE",
      rank: "Senior Adviser",
      memberId: "SKR00002",
      referredById: associate1.id,
      walletBalance: 25000,
    },
  });

  const associate3 = await prisma.user.upsert({
    where: { username: "amit.kumar" },
    update: {},
    create: {
      username: "amit.kumar",
      password: associatePassword,
      name: "Amit Kumar",
      email: "amit@example.com",
      phone: "9876543212",
      role: "ASSOCIATE",
      rank: "Client Adviser",
      memberId: "SKR00003",
      referredById: associate1.id,
      walletBalance: 5000,
    },
  });

  // Create Plots
  const plots = [];
  for (let i = 1; i <= 10; i++) {
    const plot = await prisma.plot.upsert({
      where: { plotNumber: `SKC-${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        plotNumber: `SKC-${String(i).padStart(3, '0')}`,
        projectName: "Shree Karni City",
        location: `Sector ${Math.ceil(i / 3)}, Jodhpur`,
        sizeGaj: 100 + (i * 25),
        pricePerGaj: 5000 + (i * 500),
        totalPrice: (100 + (i * 25)) * (5000 + (i * 500)),
        status: i <= 3 ? "SOLD" : i <= 5 ? "RESERVED" : "AVAILABLE",
      },
    });
    plots.push(plot);
  }

  // Create Sales for sold plots
  await prisma.sale.upsert({
    where: { plotId: plots[0].id },
    update: {},
    create: {
      plotId: plots[0].id,
      soldById: associate1.id,
      buyerName: "Mohanlal Gupta",
      buyerPhone: "9812345001",
      saleAmount: plots[0].totalPrice,
    },
  });

  await prisma.sale.upsert({
    where: { plotId: plots[1].id },
    update: {},
    create: {
      plotId: plots[1].id,
      soldById: associate1.id,
      buyerName: "Sunita Devi",
      buyerPhone: "9812345002",
      saleAmount: plots[1].totalPrice,
    },
  });

  await prisma.sale.upsert({
    where: { plotId: plots[2].id },
    update: {},
    create: {
      plotId: plots[2].id,
      soldById: associate2.id,
      buyerName: "Rakesh Patel",
      buyerPhone: "9812345003",
      saleAmount: plots[2].totalPrice,
    },
  });

  // Create Leads
  await prisma.lead.createMany({
    data: [
      { associateId: associate1.id, name: "Vikram Singh", phone: "9800000001", status: "NEW", source: "Walk-in", plotInterest: "SKC-006" },
      { associateId: associate1.id, name: "Deepak Joshi", phone: "9800000002", status: "CONTACTED", source: "Referral", plotInterest: "SKC-007" },
      { associateId: associate2.id, name: "Neha Agarwal", phone: "9800000003", status: "SITE_VISIT", source: "Online", plotInterest: "SKC-008" },
      { associateId: associate2.id, name: "Ramesh Yadav", phone: "9800000004", status: "NEGOTIATION", source: "Referral", plotInterest: "SKC-009" },
      { associateId: associate3.id, name: "Kavita Sharma", phone: "9800000005", status: "NEW", source: "Walk-in", plotInterest: "SKC-010" },
    ],
  });

  // Create Visitors
  await prisma.visitor.createMany({
    data: [
      { associateId: associate1.id, visitorName: "Suresh Meena", phone: "9700000001", plotInterest: "SKC-006", feedback: "Interested in corner plot", status: "INTERESTED" },
      { associateId: associate1.id, visitorName: "Pooja Rathore", phone: "9700000002", plotInterest: "SKC-007", feedback: "Will visit again", status: "FOLLOW_UP" },
      { associateId: associate2.id, visitorName: "Manoj Kumar", phone: "9700000003", plotInterest: "SKC-008", feedback: "Looking for bigger plot", status: "NOT_INTERESTED" },
    ],
  });

  // Create Incentives
  await prisma.incentive.createMany({
    data: [
      { associateId: associate1.id, amount: 5000, type: "SALE", description: "Commission for Plot SKC-001", status: "PAID" },
      { associateId: associate1.id, amount: 5500, type: "SALE", description: "Commission for Plot SKC-002", status: "APPROVED" },
      { associateId: associate1.id, amount: 2000, type: "REFERRAL", description: "Referral bonus for Priya Verma", status: "PAID" },
      { associateId: associate2.id, amount: 6000, type: "SALE", description: "Commission for Plot SKC-003", status: "PENDING" },
      { associateId: associate1.id, amount: 3000, type: "RANK_ACHIEVEMENT", description: "Rank upgrade bonus", status: "PENDING" },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("Admin login: admin / admin123");
  console.log("Associate login: rajesh.sharma / password123");
  console.log("Associate login: priya.verma / password123");
  console.log("Associate login: amit.kumar / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
