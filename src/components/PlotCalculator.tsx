"use client";

import { useState } from "react";
import { Calculator, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PlotCalculator() {
  const [sizeGaj, setSizeGaj] = useState<number>(150);
  const [ratePerGaj, setRatePerGaj] = useState<number>(6000);

  const handleRateChange = (val: string) => {
    if (val === "") {
      setRatePerGaj(0);
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num < 1) {
        setRatePerGaj(1);
      } else if (num > 100000) {
        setRatePerGaj(100000);
      } else {
        setRatePerGaj(num);
      }
    }
  };

  const handleSizeChange = (val: string) => {
    if (val === "") {
      setSizeGaj(0);
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (num < 1) {
        setSizeGaj(1);
      } else if (num > 5000) {
        setSizeGaj(5000);
      } else {
        setSizeGaj(num);
      }
    }
  };

  const validRate = ratePerGaj || 0;
  const validSize = sizeGaj || 0;
  const totalPrice = validSize * validRate;
  const downPayment = Math.round(totalPrice * 0.2); // 20% down payment
  const loanEligible = Math.max(0, totalPrice - downPayment);
  const estimatedEmi =
    loanEligible > 0 ? Math.round((loanEligible * 0.085 * 5 + loanEligible) / 60) : 0; // 5-year simple estimate

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
            Adjust plot size and enter custom rate per GAJ (any digits from 1 to 1,00,000).
          </p>

          {/* 1. Plot Size (Slider + Editable Input) */}
          <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm font-semibold text-slate-800">
              <span>1. Plot Size (in GAJ):</span>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={sizeGaj === 0 ? "" : sizeGaj}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  className="w-24 px-2.5 py-1 text-sm font-extrabold text-emerald-700 bg-white border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-right shadow-2xs"
                  placeholder="150"
                />
                <span className="text-xs text-slate-600 font-bold">GAJ</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  ({Math.round(validSize * 9)} Sq. Ft)
                </span>
              </div>
            </div>

            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={validSize > 1000 ? 1000 : validSize < 50 ? 50 : validSize}
              onChange={(e) => setSizeGaj(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>80 GAJ</span>
              <span>150 GAJ</span>
              <span>250 GAJ</span>
              <span>500 GAJ</span>
              <span>1000 GAJ</span>
            </div>
          </div>

          {/* 2. Rate per GAJ (Fully Editable 1 - 100000 + Slider + Quick Presets) */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm font-semibold text-slate-800">
              <div className="flex items-center gap-2">
                <span>2. Rate per GAJ:</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  Editable 1 - 1,00,000
                </span>
              </div>

              {/* Editable input field for all digits 1-100000 */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-sm font-bold text-slate-600">₹</span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  value={ratePerGaj === 0 ? "" : ratePerGaj}
                  onChange={(e) => handleRateChange(e.target.value)}
                  className="w-32 px-3 py-1 text-base font-extrabold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-right shadow-2xs"
                  placeholder="6000"
                />
                <span className="text-xs text-slate-500 font-bold">/ GAJ</span>
              </div>
            </div>

            {/* Range Slider 1 to 100,000 */}
            <input
              type="range"
              min="1"
              max="100000"
              step="100"
              value={validRate > 100000 ? 100000 : validRate < 1 ? 1 : validRate}
              onChange={(e) => setRatePerGaj(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>₹1</span>
              <span>₹25,000</span>
              <span>₹50,000</span>
              <span>₹75,000</span>
              <span>₹1,00,000</span>
            </div>

            {/* Quick rate shortcut chips */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Quick Shortcuts:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[4500, 5500, 6500, 8500, 12000, 25000].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setRatePerGaj(rate)}
                    className={`py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      validRate === rate
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ₹{rate.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
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
              <p className="text-xs text-slate-400 mt-0.5">
                {validSize} GAJ @ ₹{validRate.toLocaleString("en-IN")}/GAJ
              </p>
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
