import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Admin User",
      email: "realestateshreekarni@gmail.com",
      phone: "9999999999",
      role: "ADMIN",
      rank: "Administrator",
      memberId: "SKRADMIN",
      walletBalance: 0,
    },
  });

  // Create initial plots if not present
  for (let i = 1; i <= 10; i++) {
    await prisma.plot.upsert({
      where: { plotNumber: `SKC-${String(i).padStart(3, "0")}` },
      update: {},
      create: {
        plotNumber: `SKC-${String(i).padStart(3, "0")}`,
        projectName: "Shree Karni City",
        location: `Vatika Corridor, Jaipur`,
        sizeGaj: 100 + i * 25,
        pricePerGaj: 5000 + i * 500,
        totalPrice: (100 + i * 25) * (5000 + i * 500),
        status: i <= 3 ? "SOLD" : i <= 5 ? "RESERVED" : "AVAILABLE",
      },
    });
  }

  console.log("Seed data created successfully!");
  console.log("Admin login: admin / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
