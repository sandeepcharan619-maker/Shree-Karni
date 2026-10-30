import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Users,
  Compass,
  ArrowRight,
  LogIn,
  UserPlus,
  TreePine,
  Building2,
  BadgePercent,
  Sparkles,
  Zap,
  Droplets,
  Layers,
  Award,
  Check,
  Search,
} from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import NavbarAuth from "@/components/NavbarAuth";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import AssociateSectionButtons from "@/components/AssociateSectionButtons";
import FeaturedPlots from "@/components/FeaturedPlots";
import PlotCalculator from "@/components/PlotCalculator";
import FloatingContactPill from "@/components/FloatingContactPill";

const DEFAULT_PLOTS = [
  {
    id: "sample-1",
    plotNumber: "SKC-001",
    projectName: "Ashok Vatika",
    location: "Vatika Road Corridor, Jaipur",
    sizeGaj: 125,
    pricePerGaj: 5500,
    totalPrice: 687500,
    status: "AVAILABLE",
  },
  {
    id: "sample-2",
    plotNumber: "SKC-002",
    projectName: "Ashok Vatika",
    location: "Vatika Road Corridor, Jaipur",
    sizeGaj: 150,
    pricePerGaj: 6000,
    totalPrice: 900000,
    status: "AVAILABLE",
  },
  {
    id: "sample-3",
    plotNumber: "SKC-003",
    projectName: "Shree Karni City",
    location: "Tonk Road / Ring Road, Jaipur",
    sizeGaj: 175,
    pricePerGaj: 6500,
    totalPrice: 1137500,
    status: "AVAILABLE",
  },
  {
    id: "sample-4",
    plotNumber: "SKC-004",
    projectName: "Ashok Vatika",
    location: "Vatika Road Corridor, Jaipur",
    sizeGaj: 200,
    pricePerGaj: 7000,
    totalPrice: 1400000,
    status: "RESERVED",
  },
  {
    id: "sample-5",
    plotNumber: "SKC-005",
    projectName: "Shree Karni City",
    location: "Sector 1, Vatika Corridor, Jaipur",
    sizeGaj: 225,
    pricePerGaj: 7500,
    totalPrice: 1687500,
    status: "AVAILABLE",
  },
  {
    id: "sample-6",
    plotNumber: "SKC-006",
    projectName: "Ashok Vatika",
    location: "Vatika Road Corridor, Jaipur",
    sizeGaj: 250,
    pricePerGaj: 8000,
    totalPrice: 2000000,
    status: "AVAILABLE",
  },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let plots = DEFAULT_PLOTS;
  try {
    const dbPlots = await prisma.plot.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
    });
    if (dbPlots && dbPlots.length > 0) {
      plots = dbPlots.map((p) => ({
        id: p.id,
        plotNumber: p.plotNumber,
        projectName: p.projectName,
        location: p.location,
        sizeGaj: p.sizeGaj,
        pricePerGaj: p.pricePerGaj,
        totalPrice: p.totalPrice,
        status: p.status,
      }));
    }
  } catch (err) {
    console.warn("Could not load dynamic plots from database:", err);
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#0f172a] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Sparkles size={13} />
              JDA & RERA Approved Townships
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <MapPin size={12} className="text-emerald-400" /> Prime City: Jaipur Corridors
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:+918952821872"
              className="hover:text-emerald-400 transition flex items-center gap-1 font-medium"
            >
              <Phone size={12} className="text-emerald-400" /> +91 8952821872
            </a>
            <span className="text-slate-700">|</span>
            <a
              href="mailto:realestateshreekarni@gmail.com"
              className="hover:text-emerald-400 transition flex items-center gap-1 font-medium"
            >
              <Mail size={12} className="text-emerald-400" /> realestateshreekarni@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION (Clean White PropTech Style) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#0a1628] p-2 rounded-lg shadow-xs hover:opacity-95 transition">
              <Image
                src="/logo.png"
                alt="Shree Karni Real Estate"
                width={170}
                height={38}
                className="h-8 w-auto"
                priority
              />
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
            <Link href="/" className="text-emerald-600 font-bold transition">
              Home
            </Link>
            <Link href="#plots" className="hover:text-emerald-600 transition">
              Townships & Plots
            </Link>
            <Link href="#calculator" className="hover:text-emerald-600 transition">
              Plot Calculator
            </Link>
            <Link href="#amenities" className="hover:text-emerald-600 transition">
              Amenities
            </Link>
            <Link href="#why-us" className="hover:text-emerald-600 transition">
              Why Us
            </Link>
            <Link href="#associate" className="hover:text-emerald-600 transition">
              Associate Network
            </Link>
            <Link href="#contact" className="hover:text-emerald-600 transition">
              Contact
            </Link>
          </nav>

          {/* Login / Sign Up or Dashboard buttons */}
          <NavbarAuth />
        </div>
      </header>

      {/* 3. HERO SECTION (Concept 2 - Clean PropTech Style) */}
      <section className="relative bg-gradient-to-b from-white via-slate-50/60 to-white py-16 lg:py-24 border-b border-slate-200/70 overflow-hidden">
        {/* Subtle Tech Dot Background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Verified Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6 shadow-2xs">
              <ShieldCheck size={15} className="text-emerald-600" />
              <span>100% Clear Patta & Registry • JDA Approved Townships</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-slate-900">
              Find Verified Registry Plots in{" "}
              <span className="text-emerald-600">Jaipur&apos;s</span> Growth Corridors
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Gated townships with wide concrete roads, sweet water, electricity, and individual boundary pillars. High-appreciation land investment with instant registry.
            </p>

            {/* Hero Action Buttons */}
            <HeroAuthButtons />
          </div>

          {/* Quick Metrics Counter (PropTech Cards) */}
          <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Plots Delivered
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">500+</p>
              <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
                ✓ Handed over with boundary pillars
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Legal Guarantee
              </span>
              <p className="text-3xl font-black text-emerald-600 mt-1">100%</p>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Direct Patta & Clear Registry
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Active Associates
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">150+</p>
              <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
                Fast automated wallet payouts
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Prime City
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">Jaipur</p>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                Vatika Road & Tonk Road Corridors
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PLOTS & TOWNSHIPS SECTION */}
      <section id="plots" className="py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest block">
                Live Inventory
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                Available Townships & Plots
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Select your plot size in GAJ across our legally verified townships in Jaipur.
              </p>
            </div>

            <Link
              href="#contact"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 self-start md:self-auto bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200 transition"
            >
              <span>Schedule a Free Site Visit</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <FeaturedPlots initialPlots={plots} />
        </div>
      </section>

      {/* 5. INTERACTIVE PLOT & EMI CALCULATOR SECTION */}
      <section id="calculator" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Plan Your Investment
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Plot Budget & Down Payment Calculator
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Slide to your desired size in GAJ and view instant cost estimates and financing options.
            </p>
          </div>

          <PlotCalculator />
        </div>
      </section>

      {/* 6. INFRASTRUCTURE & TOWNSHIP AMENITIES */}
      <section id="amenities" className="py-20 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Modern Town Planning
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Township Amenities & Infrastructure
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Every Shree Karni township is designed for immediate home construction with standard civic infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <Compass size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                40ft & 30ft Wide Roads
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Damar and concrete wide roads ensuring comfortable two-way vehicle movement and easy access to every plot.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <Zap size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Underground Electricity & LED Lights
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Safe underground electricity cable wiring with automatic LED street poles across all internal lanes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <Droplets size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Sweet Drinking Water Pipeline
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct water supply pipeline connected with overhead storage tanks ensuring adequate domestic water pressure.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <Layers size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Clear Demarcation Pillars
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Numbered concrete boundary pillars installed on all four corners of each plot for absolute physical security.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <TreePine size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Parks, Greenery & Open Gym
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Designated landscaped green parks, walking tracks, and avenue tree plantation for a serene residential lifestyle.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                Grand Entry Gate & 24/7 Security
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Secured boundary wall surrounding the entire township with guarded entry gates and boom barriers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WHY CHOOSE SHREE KARNI (Trust & Transparency) */}
      <section id="why-us" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Direct Developer Assurance
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Why Shree Karni Real Estate?
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              We eliminate middlemen, fraudulent claims, and delays with complete legal title transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 font-bold">
                <Award size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">100% Clear Patta & Registry</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct registry in the buyer&apos;s name with authentic Jamabandi documents and zero legal disputes or encumbrances.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 font-bold">
                <TrendingUp size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">High Appreciation Belts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Townships located along Jaipur&apos;s expanding Ring Road, Tonk Road, and Vatika industrial growth belts with strong historical ROI.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 font-bold">
                <Building2 size={26} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Easy Bank Loan Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-approved plot loan assistance with leading public and private banks offering competitive interest rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. ASSOCIATE PARTNER NETWORK SECTION */}
      <section id="associate" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
                <BadgePercent size={14} /> Associate Partner Program
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white">
                Earn High Commissions as a Shree Karni Sales Associate
              </h2>

              <p className="mt-4 text-slate-300 text-sm leading-relaxed">
                Join our network of 150+ associates across Rajasthan. Get your private online dashboard to track downlines, monitor plot sales in GAJ, generate instant referral links, and receive automated commission payouts directly to your wallet.
              </p>

              {/* 4-Step Pathway */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80">
                  <span className="font-bold text-emerald-400 block mb-0.5">1. Free Sign-Up</span>
                  <span>Instant private username and Member ID</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80">
                  <span className="font-bold text-emerald-400 block mb-0.5">2. Digital Tree View</span>
                  <span>Real-time multi-level downline tracking</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80">
                  <span className="font-bold text-emerald-400 block mb-0.5">3. Plot Inventory Manager</span>
                  <span>Live availability grid of plots in GAJ</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80">
                  <span className="font-bold text-emerald-400 block mb-0.5">4. Fast Wallet Payouts</span>
                  <span>Automated commission disbursement</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8">
                <AssociateSectionButtons />
              </div>
            </div>

            {/* Associate Dashboard Preview Card */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                    SK
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Associate Dashboard</p>
                    <p className="text-[10px] text-slate-400">Pushpendra singh charan • SKR00001</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded font-bold border border-emerald-500/30">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-white text-xs">
                <div className="bg-[#e20082] p-3.5 rounded-lg shadow-xs">
                  <p className="text-[10px] opacity-80">ID: SKR00001</p>
                  <p className="font-bold text-sm mt-1">Member ID</p>
                </div>
                <div className="bg-[#5b64a8] p-3.5 rounded-lg shadow-xs">
                  <p className="text-[10px] opacity-80">3 Members</p>
                  <p className="font-bold text-sm mt-1">Total Downline</p>
                </div>
                <div className="bg-[#e03a27] p-3.5 rounded-lg shadow-xs">
                  <p className="text-[10px] opacity-80">275 GAJ Sold</p>
                  <p className="font-bold text-sm mt-1">Self Business</p>
                </div>
                <div className="bg-emerald-600 p-3.5 rounded-lg shadow-xs">
                  <p className="text-[10px] opacity-80">₹15,000</p>
                  <p className="font-bold text-sm mt-1">Wallet Balance</p>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg text-[11px] text-slate-400 flex items-center justify-between border border-slate-800">
                <span className="truncate">https://shreekarnirealestate.in/register?ref=SKR00001</span>
                <span className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[10px] font-bold shrink-0 ml-2">
                  Copy Link
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. ABOUT US SECTION */}
      <section id="about" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                About Our Company
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                Shree Karni Real Estate
              </h2>
              <p className="mt-4 text-slate-600 text-sm leading-relaxed">
                Founded with a mission to deliver genuine land investments with 100% legal clarity, Shree Karni Real Estate has become a hallmark of reliability for property buyers and associate consultants across Jaipur.
              </p>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Whether you are purchasing your first plot for building a dream home or an associate aspiring to build an independent sales network, Shree Karni provides the backing, legal documentation, and technology infrastructure you need.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="border-l-3 border-emerald-500 pl-3">
                  <h4 className="text-sm font-bold text-slate-900">Clear Demarcations</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Physical boundary pillars on all sites.</p>
                </div>
                <div className="border-l-3 border-emerald-500 pl-3">
                  <h4 className="text-sm font-bold text-slate-900">Bank Loan Support</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Assistance with leading public & private banks.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Our Core Values</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">Complete Title Transparency</strong>
                    <span className="text-xs text-slate-500">Every plot is backed by authentic ownership documents open for client scrutiny.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">Empowering Sales Talent</strong>
                    <span className="text-xs text-slate-500">Industry-leading commission payouts with automated digital tracking.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">Customer-First Site Visits</strong>
                    <span className="text-xs text-slate-500">Free weekend conveyance and personalized consultations with our property experts.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 10. CONTACT & SITE VISIT INQUIRY SECTION */}
      <section id="contact" className="py-20 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Get In Touch
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                Schedule a Free Site Visit
              </h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Visit our ongoing townships in Jaipur with our property experts. Free site visit conveyance available every weekend.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Office Location</p>
                    <p className="text-xs text-slate-500">
                      Shree Karni Real Estate, Main Vatika Road, Jaipur, Rajasthan, India
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Direct Phone Helpline</p>
                    <a
                      href="tel:+918952821872"
                      className="text-xs text-emerald-700 font-bold hover:underline"
                    >
                      +91 8952821872
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Official Email</p>
                    <a
                      href="mailto:realestateshreekarni@gmail.com"
                      className="text-xs text-slate-600 hover:text-emerald-700"
                    >
                      realestateshreekarni@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <InquiryForm />
          </div>
        </div>
      </section>

      {/* 11. FOOTER (Clean Slate PropTech) */}
      <footer className="bg-[#0f172a] text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="bg-[#0a1628] p-2 rounded-lg inline-block mb-3 border border-slate-800">
              <Image
                src="/logo.png"
                alt="Shree Karni Real Estate"
                width={150}
                height={32}
                className="h-7 w-auto"
              />
            </div>
            <p className="mt-2 text-slate-400 leading-relaxed text-xs">
              Premier real estate developers and associate network offering legally sanctioned plots across Jaipur.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-emerald-400 transition">Home</Link></li>
              <li><Link href="#plots" className="hover:text-emerald-400 transition">Available Plots</Link></li>
              <li><Link href="#calculator" className="hover:text-emerald-400 transition">Plot Calculator</Link></li>
              <li><Link href="#amenities" className="hover:text-emerald-400 transition">Township Amenities</Link></li>
              <li><Link href="#contact" className="hover:text-emerald-400 transition">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Associate Portal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/login"
                  className="hover:text-emerald-400 transition flex items-center gap-1 font-semibold text-emerald-400"
                >
                  <LogIn size={13} /> Associate Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-emerald-400 transition flex items-center gap-1 font-semibold text-emerald-400"
                >
                  <UserPlus size={13} /> Register as Associate
                </Link>
              </li>
              <li><Link href="/dashboard" className="hover:text-emerald-400 transition">My Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-slate-500 transition text-[11px]">Admin Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Contact Information</h4>
            <p className="text-slate-400 leading-relaxed">
              Shree Karni Real Estate<br />
              Main Vatika Road, Jaipur, Rajasthan, India<br />
              Phone: +91 8952821872<br />
              Email: realestateshreekarni@gmail.com
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2024 Shree Karni Real Estate. All rights reserved.</p>
          <p>www.shreekarnirealestate.in</p>
        </div>
      </footer>

      {/* 12. FLOATING WHATSAPP & PHONE ACTION PILL */}
      <FloatingContactPill />
    </div>
  );
}
