"use client";

import { useState } from "react";
import { RefreshCw, Send, CheckCircle2 } from "lucide-react";

export default function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    requirement: "100 - 150 GAJ Plot",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send message. Please call us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center py-12 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Inquiry Received!</h3>
        <p className="text-xs text-gray-600 mt-2 max-w-sm mx-auto leading-relaxed">
          Thank you, <span className="font-semibold text-gray-900">{form.name}</span>. Your details have been delivered to our management team at{" "}
          <span className="font-medium text-blue-600">realestateshreekarni@gmail.com</span>.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          A property advisor will contact you on{" "}
          <span className="font-semibold text-gray-800">{form.phone}</span> shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", phone: "", requirement: "100 - 150 GAJ Plot", message: "" });
          }}
          className="mt-6 text-xs text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
        >
          ← Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Send Us a Message</h3>
      <p className="text-xs text-gray-500 mb-4">
        Fill out your details below. Our team will be notified immediately.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg mb-4 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Rameshwar Choudhary"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9829012345"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Plot Requirement</label>
            <select
              value={form.requirement}
              onChange={(e) => setForm({ ...form, requirement: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500 bg-white cursor-pointer"
            >
              <option>100 - 150 GAJ Plot</option>
              <option>150 - 250 GAJ Plot</option>
              <option>Commercial Plot</option>
              <option>Become an Associate</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Message or Queries</label>
          <textarea
            rows={3}
            placeholder="Tell us what location, sector, or budget you have in mind..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#0a1628] hover:bg-[#11243f] text-white font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin text-yellow-400" />
              <span>Sending Inquiry...</span>
            </>
          ) : (
            <>
              <Send size={15} className="text-yellow-400" />
              <span>Submit Inquiry</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
