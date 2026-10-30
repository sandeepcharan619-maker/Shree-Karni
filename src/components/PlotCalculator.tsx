"use client";

import { useState } from "react";
import { Calculator, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PlotCalculator() {
  const [sizeGaj, setSizeGaj] = useState<number>(150);
  const [ratePerGaj, setRatePerGaj] = useState<number>(6000);

  const totalPrice = sizeGaj * ratePerGaj;
  const downPayment = Math.round(totalPrice * 0.2); // 20% down payment
  const loanEligible = totalPrice - downPayment;
  const estimatedEmi = Math.round((loanEligible * 0.085 * 5 + loanEligible) / 60); // 5 year simple estimate

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8 overflow-hidden relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left: Interactive Controls */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
            <Calculator size={16} />
            <span>Instant Plot & Investment Calculator</span>
          </div>

          <h3 className="text-2xl font-extrabold text-slate-900">
            Calculate Your Plot Cost & Down Payment
          </h3>
          <p className="text-slate-600 text-sm">
            Adjust plot size and select rates across our Jaipur township corridors.
          </p>

          {/* Slider 1: Size in GAJ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
              <span>Plot Size:</span>
              <span className="text-emerald-700 font-extrabold text-base bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                {sizeGaj} GAJ ({Math.round(sizeGaj * 9)} Sq. Ft)
              </span>
            </div>
            <input
              type="range"
              min="80"
              max="500"
              step="10"
              value={sizeGaj}
              onChange={(e) => setSizeGaj(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>80 GAJ (Compact)</span>
              <span>250 GAJ (Standard)</span>
              <span>500 GAJ (Luxury Villa)</span>
            </div>
          </div>

          {/* Slider 2: Rate per GAJ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
              <span>Rate per GAJ:</span>
              <span className="text-slate-900 font-extrabold text-base bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                ₹{ratePerGaj.toLocaleString("en-IN")} / GAJ
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[4500, 5500, 6500, 8000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setRatePerGaj(rate)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                    ratePerGaj === rate
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  ₹{rate.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> JDA Approved Registry
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-600" /> Bank Loan Assistance
            </span>
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:w-80 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
              Estimated Investment
            </span>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-black text-white">
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Total Registry Plot Cost</p>
            </div>

            <div className="space-y-3 py-4 border-t border-slate-700/80 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Min. Booking / Down Payment (20%):</span>
                <span className="font-bold text-emerald-400">
                  ₹{downPayment.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Bank Loan Available (Up to 80%):</span>
                <span className="font-semibold text-white">
                  ₹{loanEligible.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Est. 5-Yr Bank EMI:</span>
                <span className="font-semibold text-white">
                  ~₹{estimatedEmi.toLocaleString("en-IN")} / mo
                </span>
              </div>
            </div>
          </div>

          <Link
            href="#contact"
            className="mt-4 w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <span>Book This Plot Size Now</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
