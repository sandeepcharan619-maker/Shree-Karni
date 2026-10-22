"use client";

import { useState } from "react";

export default function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    requirement: "100 - 150 GAJ Plot",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center py-12">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
          ✓
        </div>
        <h3 className="text-lg font-bold text-gray-800">Inquiry Received!</h3>
        <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
          Thank you for reaching out. A Shree Karni property consultant will contact you on{" "}
          <span className="font-semibold text-gray-800">{form.phone}</span> within 2 business hours.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", phone: "", requirement: "100 - 150 GAJ Plot", message: "" });
          }}
          className="mt-5 text-xs text-blue-600 hover:underline font-semibold"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Send Us a Message</h3>
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
              placeholder="9876543210"
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
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500"
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
            placeholder="Tell us what location or budget you have in mind..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#0a1628] hover:bg-[#11243f] text-white font-bold rounded-lg text-sm transition"
        >
          Submit Inquiry
        </button>
      </form>
    </div>
  );
}
