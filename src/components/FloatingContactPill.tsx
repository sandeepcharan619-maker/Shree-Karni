"use client";

import { Phone, MessageCircle } from "lucide-react";

export default function FloatingContactPill() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* WhatsApp Action */}
      <a
        href="https://wa.me/918952821872?text=Hello%20Shree%20Karni%20Real%20Estate,%20I%20am%20interested%20in%20plots%20in%20Jaipur."
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-3.5 py-2.5 rounded-full font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle size={17} />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      {/* Direct Call Action */}
      <a
        href="tel:+918952821872"
        title="Direct Call"
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-full font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 border border-slate-700"
      >
        <Phone size={16} className="text-emerald-400" />
        <span className="hidden sm:inline">+91 8952821872</span>
      </a>
    </div>
  );
}
