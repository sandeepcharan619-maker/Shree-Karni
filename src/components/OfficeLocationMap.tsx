"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  ExternalLink,
  Car,
  Compass,
  Building,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

export default function OfficeLocationMap() {
  const [selectedView, setSelectedView] = useState<"office" | "corridor">("office");

  const officeEmbedUrl =
    "https://maps.google.com/maps?q=Shree+Karni+Real+Estate,+Main+Vatika+Road,+Jaipur,+Rajasthan&t=&z=15&ie=UTF8&iwloc=&output=embed";

  const corridorEmbedUrl =
    "https://maps.google.com/maps?q=Vatika+Road,+Tonk+Road,+Jaipur,+Rajasthan&t=&z=13&ie=UTF8&iwloc=&output=embed";

  const googleMapsDirectionsUrl =
    "https://www.google.com/maps/search/?api=1&query=Shree+Karni+Real+Estate+Main+Vatika+Road+Jaipur+Rajasthan";

  return (
    <section id="office-map" className="py-20 bg-slate-100/70 border-b border-slate-200 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <MapPin size={13} className="text-emerald-600" />
            <span>Interactive Office Location</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Visit Our Head Office in Jaipur
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Drop in for a warm cup of tea and a detailed consultation on our ongoing JDA &amp; RERA approved
            townships, registry documents, and associate earning programs.
          </p>

          {/* Quick Location Switcher Buttons */}
          <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs mt-6">
            <button
              onClick={() => setSelectedView("office")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedView === "office"
                  ? "bg-[#0f172a] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building size={14} />
              <span>Head Office (Vatika Road)</span>
            </button>
            <button
              onClick={() => setSelectedView("corridor")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedView === "corridor"
                  ? "bg-[#0f172a] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass size={14} />
              <span>Township Corridor (Jaipur South)</span>
            </button>
          </div>
        </div>

        {/* Map & Office Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Interactive Google Map */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col min-h-[420px] sm:min-h-[480px]">
            {/* Map Top Bar */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wide">
                  {selectedView === "office"
                    ? "Live Map: Shree Karni Real Estate Head Office"
                    : "Live Map: Vatika Road & Tonk Road Township Belt"}
                </span>
              </div>
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-300 hover:text-white transition flex items-center gap-1 font-semibold"
              >
                <span>Full Map</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Embedded Iframe */}
            <div className="relative flex-1 w-full bg-slate-200 min-h-[360px]">
              <iframe
                title="Shree Karni Real Estate Office Location Map"
                src={selectedView === "office" ? officeEmbedUrl : corridorEmbedUrl}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Map Bottom Hint */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-1">
                <Car size={13} className="text-emerald-600" />
                Easy vehicle access from Ring Road &amp; Tonk Road
              </span>
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
              >
                Open in Google Maps App &rarr;
              </a>
            </div>
          </div>

          {/* Right: Office Details & Direct Actions Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-3">
                <Building size={13} className="text-amber-600" />
                <span>Corporate Headquarters</span>
              </div>

              <h3 className="text-2xl font-black text-slate-900">
                Shree Karni Real Estate
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Government Certified Developers &amp; Colonizers
              </p>

              {/* Address info block */}
              <div className="mt-5 space-y-3.5">
                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Office Address
                    </h4>
                    <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed">
                      Main Vatika Road, Near Ring Road Expressway,<br />
                      Jaipur, Rajasthan – 303905, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Working Hours
                    </h4>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Monday to Sunday: <span className="font-bold text-slate-900">9:00 AM – 7:30 PM</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      Open all 7 days for township site visits &amp; bookings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Office Contact
                    </h4>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Call: <a href="tel:+918952821872" className="font-bold text-slate-900 hover:text-emerald-600">+91 8952821872</a>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Email: realestateshreekarni@gmail.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Office Highlights */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2.5">
                  Visitor Facilities
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Free Visitor Parking
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> AC Lounge &amp; Wi-Fi
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Township Master Maps
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> Free Site Conveyance
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Navigation size={15} />
                <span>Get Directions in Google Maps</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+918952821872"
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center"
                >
                  <Phone size={13} />
                  <span>Call Office</span>
                </a>
                <a
                  href="https://wa.me/918952821872?text=Hello%20Shree%20Karni%20Real%20Estate,%20I%20want%20to%20visit%20your%20office%20at%20Main%20Vatika%20Road,%20Jaipur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center"
                >
                  <MessageCircle size={13} className="text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
