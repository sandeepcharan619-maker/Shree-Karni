-- =========================================================================
-- SHREE KARNI REAL ESTATE - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ASSOCIATE', -- 'ADMIN' or 'ASSOCIATE'
    "rank" TEXT NOT NULL DEFAULT 'Client Adviser',
    "memberId" TEXT UNIQUE NOT NULL,
    "referredById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customDownline" INTEGER,
    "customSalesGaj" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Extended Profile Details
    "gender" TEXT DEFAULT 'Male',
    "avatarUrl" TEXT,
    "address" TEXT,
    "state" TEXT DEFAULT 'Rajasthan',
    "district" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "tahsil" TEXT,
    "villagePost" TEXT,
    "spouseName" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "accountHolder" TEXT,
    "upiId" TEXT,
    "nomineeName" TEXT,
    "nomineeRelation" TEXT,
    "nomineePhone" TEXT
);

-- 2. Create Plot table
CREATE TABLE IF NOT EXISTS "Plot" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "plotNumber" TEXT UNIQUE NOT NULL,
    "projectName" TEXT NOT NULL DEFAULT 'Shree Karni City',
    "location" TEXT NOT NULL,
    "sizeGaj" DOUBLE PRECISION NOT NULL,
    "pricePerGaj" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'SOLD', 'RESERVED'
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Sale table
CREATE TABLE IF NOT EXISTS "Sale" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "plotId" TEXT UNIQUE NOT NULL REFERENCES "Plot"("id") ON DELETE CASCADE,
    "soldById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "saleAmount" DOUBLE PRECISION NOT NULL,
    "saleDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Lead / CRM Enquiry table
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "associateId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'VISITED', 'NEGOTIATION', 'WON', 'LOST'
    "source" TEXT DEFAULT 'Website',
    "budget" TEXT,
    "preferredSizeGaj" DOUBLE PRECISION,
    "preferredLocation" TEXT DEFAULT 'Jaipur',
    "plotInterest" TEXT,
    "notes" TEXT,
    "followUpDate" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Visitor / Site Visit table
CREATE TABLE IF NOT EXISTS "Visitor" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "associateId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "visitorName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "projectName" TEXT DEFAULT 'Shree Karni City',
    "plotInterest" TEXT,
    "visitDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "timeSlot" TEXT DEFAULT '10:00 AM - 12:00 PM',
    "pickupLocation" TEXT,
    "driverOrCab" TEXT,
    "feedback" TEXT,
    "rating" INTEGER DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Incentive table
CREATE TABLE IF NOT EXISTS "Incentive" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "associateId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and Grant Permissions for Supabase API access
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Visitor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Incentive" ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated full read/write for app operation
CREATE POLICY "Allow public read-write for User" ON "User" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for Plot" ON "Plot" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for Sale" ON "Sale" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for Lead" ON "Lead" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for Visitor" ON "Visitor" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for Incentive" ON "Incentive" FOR ALL USING (true) WITH CHECK (true);
