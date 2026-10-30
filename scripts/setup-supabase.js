const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const schemaPath = path.join(rootDir, "prisma", "schema.prisma");

console.log("==================================================");
console.log(" 🚀 Shree Karni Real Estate - Supabase Setup Hook ");
console.log("==================================================");

if (!fs.existsSync(envPath)) {
  console.error("❌ Error: .env file not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(postgres[^"'\s]+)["']?/);

if (!dbUrlMatch) {
  console.log("\n⚠️ No PostgreSQL URL found in DATABASE_URL.");
  console.log("To connect Supabase:");
  console.log("1. Go to https://supabase.com and create a project.");
  console.log("2. Copy your connection string from Project Settings -> Database.");
  console.log("3. Add it to .env as DATABASE_URL=\"postgresql://...\"");
  console.log("4. Run: node scripts/setup-supabase.js\n");
  process.exit(0);
}

console.log("\n✅ Detected Supabase PostgreSQL connection string in .env!");

// Update prisma/schema.prisma to use postgresql
let schema = fs.readFileSync(schemaPath, "utf-8");
if (schema.includes('provider = "sqlite"')) {
  console.log("🔄 Updating Prisma schema datasource from sqlite to postgresql...");
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
  );
  fs.writeFileSync(schemaPath, schema, "utf-8");
  console.log("✅ Updated prisma/schema.prisma successfully!");
}

try {
  console.log("\n📦 Running Prisma generate...");
  execSync("npx prisma generate", { cwd: rootDir, stdio: "inherit" });

  console.log("\n🚀 Pushing schema and creating tables in Supabase...");
  execSync("npx prisma db push", { cwd: rootDir, stdio: "inherit" });

  console.log("\n🌱 Seeding initial database...");
  execSync("npx tsx prisma/seed.ts", { cwd: rootDir, stdio: "inherit" });

  console.log("\n🎉 Supabase connected and all tables initialized successfully!");
} catch (err) {
  console.error("\n❌ Setup error:", err.message);
  process.exit(1);
}
