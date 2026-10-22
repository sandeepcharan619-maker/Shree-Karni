# 🏠 Shree Karni Real Estate — Property Management Platform

A modern real estate associate network and property management platform built with **Next.js 14**, **Tailwind CSS**, **Prisma**, and **NextAuth.js**.

---

## 📸 Key Features

- **Associate Dashboard**: Closely matching the reference UI layout with 6 high-contrast gradient stat cards:
  - 🟣 **Member ID** (`ID: SKR00001`) with gift watermark
  - 🟪 **Total Downline** with checkmark watermark
  - 🔵 **Currant Rank** (e.g. *Client Adviser*) with menu watermark
  - 🔴 **Self Business (GAJ)** with gift watermark
  - 🟦 **Bank Wallet Balance** with Rupee (`₹`) watermark
  - 🟠 **Total Business (GAJ)** with checkmark watermark
- **Referral System**: One-click **Copy Link** to register downline associates (`/register?ref=MEMBER_ID`)
- **Admin Panel (`/admin`)**:
  - Global dashboard overview (total volume, plots sold, revenue, pending payouts)
  - Associate management (activate/deactivate, promote ranks)
  - Add & manage plots (with automatic price calculation in GAJ)
  - Sales overview tracking which associate closed each deal
  - Commission/incentive approval and disbursement
- **Associate Tools (`/dashboard`)**:
  - Register New Associate under direct referral
  - View Direct Team & Total Downline tree
  - Plot Manager with real-time status (Available, Reserved, Sold)
  - Incentive tracking & Wallet balance
  - Site Visitor Management (log visits & feedback)
  - Lead Manager (track leads across sales funnel)
  - Profile & Password management

---

## 🚀 Demo Accounts

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| **Admin** | `admin` | `admin123` | Full access to `/admin` and platform settings |
| **Associate 1** | `rajesh.sharma` | `password123` | Member ID: `SKR00001` (has team & sales) |
| **Associate 2** | `priya.verma` | `password123` | Member ID: `SKR00002` (in Rajesh's downline) |
| **Associate 3** | `amit.kumar` | `password123` | Member ID: `SKR00003` |

---

## 💻 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Push database schema & generate Prisma Client
npx prisma db push

# 3. Seed demo accounts & properties
npx tsx prisma/seed.ts

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🌐 Deploying to GitHub & Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit of Shree Karni Real Estate platform"
git branch -M main
git remote add origin https://github.com/<your-username>/shreekarnirealestate.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**
2. Import the `shreekarnirealestate` GitHub repository
3. Set the following **Environment Variables** in Vercel:
   - `DATABASE_URL`: Your Postgres connection string (e.g. from Vercel Postgres / Neon / Supabase)
   - `NEXTAUTH_SECRET`: A secure random string (e.g., generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: Your Vercel domain (e.g. `https://shreekarnirealestate.vercel.app`)
4. Click **Deploy**!
