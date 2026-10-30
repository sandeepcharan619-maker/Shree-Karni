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
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import InquiryForm from "@/components/InquiryForm";
import NavbarAuth from "@/components/NavbarAuth";
import HeroAuthButtons from "@/components/HeroAuthButtons";
import AssociateSectionButtons from "@/components/AssociateSectionButtons";
import FeaturedPlots from "@/components/FeaturedPlots";

const DEFAULT_PLOTS = [
  {
    id: "sample-1",
    plotNumber: "SKC-001",
    projectName: "Shree Karni City",
    location: "Sector 1, Jodhpur",
    sizeGaj: 125,
    pricePerGaj: 5500,
    totalPrice: 687500,
    status: "AVAILABLE",
  },
  {
    id: "sample-2",
    plotNumber: "SKC-002",
    projectName: "Shree Karni City",
    location: "Sector 2, Jodhpur",
    sizeGaj: 150,
    pricePerGaj: 6000,
    totalPrice: 900000,
    status: "AVAILABLE",
  },
  {
    id: "sample-3",
    plotNumber: "SKC-003",
    projectName: "Karni Enclave",
    location: "Tonk Road / Vatika Corridor, Jaipur",
    sizeGaj: 175,
    pricePerGaj: 6500,
    totalPrice: 1137500,
    status: "AVAILABLE",
  },
  {
    id: "sample-4",
    plotNumber: "SKC-004",
    projectName: "Royal Karni Greens",
    location: "Sector 3, Jodhpur",
    sizeGaj: 200,
    pricePerGaj: 7000,
    totalPrice: 1400000,
    status: "RESERVED",
  },
  {
    id: "sample-5",
    plotNumber: "SKC-005",
    projectName: "Karni Enclave",
    location: "Vatika Road, Jaipur",
    sizeGaj: 225,
    pricePerGaj: 7500,
    totalPrice: 1687500,
    status: "AVAILABLE",
  },
  {
    id: "sample-6",
    plotNumber: "SKC-006",
    projectName: "Shree Karni City",
    location: "Sector 1, Jodhpur",
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
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    if (dbPlots && dbPlots.length > 0) {
      plots = dbPlots;
    }
  } catch (err) {
    // Graceful fallback during build step prerendering or when DB is initializing
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#071322] text-gray-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-yellow-400 font-medium">
              <Sparkles size={13} />
              JDA & RERA Approved Townships in Rajasthan
            </span>
            <span className="hidden md:inline text-gray-500">•</span>
            <span className="hidden md:flex items-center gap-1 text-gray-300">
              <MapPin size={12} className="text-yellow-400" /> Jaipur Corridors
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a href="tel:+918952821872" className="hover:text-yellow-400 transition flex items-center gap-1">
              <Phone size={12} className="text-yellow-400" /> +91 8952821872
            </a>
            <span className="text-gray-600">|</span>
            <a href="mailto:realestateshreekarni@gmail.com" className="hover:text-yellow-400 transition flex items-center gap-1">
              <Mail size={12} className="text-yellow-400" /> realestateshreekarni@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#0a1628] p-2 rounded-lg">
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

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
            <Link href="/" className="text-yellow-600 font-semibold hover:text-yellow-700 transition">
              Home
            </Link>
            <Link href="#about" className="hover:text-yellow-600 transition">
              About Us
            </Link>
            <Link href="#plots" className="hover:text-yellow-600 transition">
              Townships & Plots
            </Link>
            <Link href="#why-us" className="hover:text-yellow-600 transition">
              Why Shree Karni
            </Link>
            <Link href="#associate" className="hover:text-yellow-600 transition">
              Associate Network
            </Link>
            <Link href="#contact" className="hover:text-yellow-600 transition">
              Contact
            </Link>
          </nav>

          {/* Login / Sign Up or Dashboard buttons */}
          <NavbarAuth />
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative bg-[#071322] text-white py-20 lg:py-28 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e9b04c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-semibold mb-6">
              <ShieldCheck size={14} />
              <span>100% Verified Legal Titles • JDA / RERA Approved</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Invest in Prime Plots with{" "}
              <span className="text-[#e9b04c]">Shree Karni Real Estate</span>
            </h1>

            <p className="mt-5 text-lg text-gray-300 leading-relaxed max-w-2xl">
              Delivering secure, high-yield residential and commercial plots across Rajasthan&apos;s fastest growing corridors. Gated townships with wide roads, water, electricity, and clear demarcation.
            </p>

            {/* Dynamic Hero Buttons */}
            <HeroAuthButtons />
          </div>

          {/* Quick Metrics Counter */}
          <div className="mt-16 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div>
              <p className="text-3xl font-extrabold text-[#e9b04c]">500+</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Plots Delivered</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Clear Patta & Registry</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#e9b04c]">150+</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Active Associates</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white">Prime City</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Jaipur</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PLOTS / PROPERTIES SECTION */}
      <section id="plots" className="py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-yellow-600 uppercase tracking-widest">
                Current Projects
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">
                Available Townships & Plots
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Select your plot in our ongoing gated townships with instant booking.
              </p>
            </div>

            <Link
              href="#contact"
              className="mt-4 md:mt-0 text-sm font-semibold text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
            >
              <span>Schedule a Free Site Visit</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <FeaturedPlots initialPlots={plots} />
        </div>
      </section>

      {/* 5. WHY CHOOSE SHREE KARNI */}
      <section id="why-us" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-yellow-600 uppercase tracking-widest">
              Trust & Transparency
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Why Shree Karni Real Estate?
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              We eliminate intermediaries and uncertainty with direct registry, approved town planning, and clear demarcation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-yellow-400 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-5 font-bold">
                <ShieldCheck size={26} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">100% Legal & Approved</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                All our project land titles are thoroughly verified by legal counsels with sanctioned layouts, direct registries, and zero legal entanglements.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-yellow-400 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 font-bold">
                <TrendingUp size={26} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">High Appreciation Corridors</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Strategically positioned along expanding highway corridors, upcoming industrial hubs, and metro lines ensuring exceptional capital growth.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-yellow-400 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-5 font-bold">
                <TreePine size={26} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Modern Infrastructure</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Underground electric cables, concrete wide roads, tree plantation, LED streetlights, and dedicated parks ready for home construction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ASSOCIATE NETWORK / SALES PERSON SECTION */}
      <section id="associate" className="py-20 bg-gradient-to-br from-[#071322] via-[#0d223c] to-[#071322] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-700/60 p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <BadgePercent size={14} /> Partner With Us
                </span>

                <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                  Become a Shree Karni Sales Associate
                </h2>

                <p className="mt-4 text-gray-300 text-base leading-relaxed">
                  Join our expanding family of over 150+ associates. Get access to your personalized online dashboard to track downlines, monitor plot sales in GAJ, generate referral links, and receive automated commission payouts directly to your wallet.
                </p>

                <div className="mt-6 space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
                    <span>Instant private username and dashboard access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
                    <span>Real-time multi-level downline commission tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
                    <span>Lead management & site visitor tracking tools</span>
                  </div>
                </div>

                {/* Dynamic Associate Section Buttons */}
                <AssociateSectionButtons />
              </div>

              {/* Graphical Card Preview */}
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold text-xs">
                      SK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Associate Dashboard</p>
                      <p className="text-[10px] text-gray-400">Pushpendra singh charan • SKR00001</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-medium">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-white text-xs">
                  <div className="bg-[#e20082] p-3 rounded-md">
                    <p className="text-[10px] opacity-80">ID: SKR00001</p>
                    <p className="font-bold text-sm mt-1">Member ID</p>
                  </div>
                  <div className="bg-[#5b64a8] p-3 rounded-md">
                    <p className="text-[10px] opacity-80">3</p>
                    <p className="font-bold text-sm mt-1">Total Downline</p>
                  </div>
                  <div className="bg-[#e03a27] p-3 rounded-md">
                    <p className="text-[10px] opacity-80">275 GAJ</p>
                    <p className="font-bold text-sm mt-1">Self Business</p>
                  </div>
                  <div className="bg-[#00c0f3] p-3 rounded-md">
                    <p className="text-[10px] opacity-80">₹15,000</p>
                    <p className="font-bold text-sm mt-1">Wallet Balance</p>
                  </div>
                </div>

                <div className="bg-slate-900 p-2.5 rounded text-[11px] text-gray-400 flex items-center justify-between">
                  <span className="truncate">https://shreekarnirealestate.in/register?ref=SKR00001</span>
                  <span className="bg-[#00a65a] text-white px-2 py-1 rounded text-[10px] font-bold">Copy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ABOUT US SECTION */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-yellow-600 uppercase tracking-widest">
                About Our Company
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">
                Shree Karni Real Estate
              </h2>
              <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                Established with a vision to deliver genuine land investments with 100% legal clarity, Shree Karni Real Estate has become a hallmark of reliability for property buyers and associates across Rajasthan.
              </p>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                Whether you are purchasing your first plot for building a home, an investor seeking compounding appreciation, or a real estate consultant aspiring to build an independent sales network, Shree Karni provides the backing, legal documentation, and technology infrastructure you need.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="border-l-2 border-yellow-500 pl-3">
                  <h4 className="text-sm font-bold text-gray-800">Clear Demarcations</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Physical boundary pillars on all sites.</p>
                </div>
                <div className="border-l-2 border-yellow-500 pl-3">
                  <h4 className="text-sm font-bold text-gray-800">Bank Loan Support</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Assistance with leading public & private banks.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Our Core Values</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-sm text-gray-800 block">Complete Title Transparency</strong>
                    <span className="text-xs text-gray-500">Every plot is backed by authentic ownership documents open for client scrutiny.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-sm text-gray-800 block">Empowering Local Sales Talent</strong>
                    <span className="text-xs text-gray-500">Industry-leading commission payouts with automated digital tracking.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-sm text-gray-800 block">Customer-First Site Visits</strong>
                    <span className="text-xs text-gray-500">Free weekend conveyance and personalized consultations with our property experts.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CONTACT / INQUIRY SECTION */}
      <section id="contact" className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <span className="text-xs font-bold text-yellow-600 uppercase tracking-widest">
                Get In Touch
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">
                Book a Site Visit or Inquire
              </h2>
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                Have questions about available plot numbers, GAJ measurements, or want to schedule a visit to Shree Karni City? Fill the form and our representative will call you immediately.
              </p>

              <div className="mt-8 space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Head Office</p>
                    <p className="text-xs text-gray-500">Main Vatika Road, Jaipur, Rajasthan, India</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Direct Phone</p>
                    <p className="text-xs text-gray-500">+91 8952821872</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email Address</p>
                    <p className="text-xs text-gray-500">realestateshreekarni@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <InquiryForm />
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#050c16] text-gray-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="bg-[#0a1628] p-2 rounded-lg inline-block mb-3">
              <Image
                src="/logo.png"
                alt="Shree Karni Real Estate"
                width={150}
                height={32}
                className="h-7 w-auto"
              />
            </div>
            <p className="mt-2 text-gray-400 leading-relaxed">
              Premier real estate developers and associate network offering legally sanctioned plots across Jaipur.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-yellow-400 transition">Home</Link></li>
              <li><Link href="#about" className="hover:text-yellow-400 transition">About Company</Link></li>
              <li><Link href="#plots" className="hover:text-yellow-400 transition">Available Plots</Link></li>
              <li><Link href="#why-us" className="hover:text-yellow-400 transition">Why Shree Karni</Link></li>
              <li><Link href="#contact" className="hover:text-yellow-400 transition">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Associate Portal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-yellow-400 transition flex items-center gap-1 font-semibold text-yellow-500">
                  <LogIn size={13} /> Associate Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-yellow-400 transition flex items-center gap-1 font-semibold text-yellow-500">
                  <UserPlus size={13} /> Register as Associate
                </Link>
              </li>
              <li><Link href="/dashboard" className="hover:text-yellow-400 transition">My Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-gray-500 transition text-[11px]">Admin Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">Contact Information</h4>
            <p className="text-gray-400 leading-relaxed">
              Shree Karni Real Estate<br />
              Main Vatika Road, Jaipur, Rajasthan, India<br />
              Phone: +91 8952821872<br />
              Email: realestateshreekarni@gmail.com
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-900 text-center text-[11px] text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2024 Shree Karni Real Estate. All rights reserved.</p>
          <p>www.shreekarnirealestate.in</p>
        </div>
      </footer>
    </div>
  );
}
