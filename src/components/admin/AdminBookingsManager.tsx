"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Printer,
  ExternalLink,
  X,
  CreditCard,
  MapPin,
  User,
  AlertCircle,
  Sparkles,
  Edit2,
  Save,
} from "lucide-react";

interface Booking {
  id: string;
  bookingNumber: string;
  plotId: string;
  plot: {
    id: string;
    plotNumber: string;
    projectName: string;
    location: string;
    sizeGaj: number;
    pricePerGaj: number;
    totalPrice: number;
    facing?: string | null;
    roadWidth?: string | null;
    status: string;
  };
  customerId?: string | null;
  customer?: {
    id: string;
    customerId: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  } | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  associate?: {
    id: string;
    memberId: string;
    name: string;
    phone?: string | null;
    rank?: string | null;
  } | null;
  totalPlotAmount: number;
  bookingAmount: number;
  balanceAmount: number;
  paymentMode: string;
  transactionRef?: string | null;
  status: string; // PENDING_APPROVAL, CONFIRMED, CANCELLED, COMPLETED
  agreementStatus: string;
  bookingDate: string;
  notes?: string | null;
  payments: any[];
}

interface AdminBookingsManagerProps {
  initialBookings: Booking[];
  availablePlots: {
    id: string;
    plotNumber: string;
    projectName: string;
    sizeGaj: number;
    pricePerGaj: number;
    totalPrice: number;
  }[];
  associates: { id: string; name: string; memberId: string }[];
  customers: { id: string; customerId: string; name: string; phone: string }[];
}

export default function AdminBookingsManager({
  initialBookings,
  availablePlots,
  associates,
  customers,
}: AdminBookingsManagerProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit Booking Form
  const [editForm, setEditForm] = useState({
    id: "",
    bookingNumber: "",
    plotNumber: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    associateId: "",
    totalPlotAmount: "",
    bookingAmount: "",
    balanceAmount: "",
    paymentMode: "UPI",
    transactionRef: "",
    status: "CONFIRMED",
    agreementStatus: "PENDING",
    notes: "",
  });

  // New Booking Form
  const [form, setForm] = useState({
    plotId: availablePlots[0]?.id || "",
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "Vatika, Jaipur, Rajasthan",
    associateId: associates[0]?.id || "",
    bookingAmount: "250000",
    paymentMode: "UPI",
    transactionRef: "",
    bankName: "",
    notes: "Booking advance received",
  });

  const selectedPlotObj = availablePlots.find((p) => p.id === form.plotId);
  const totalPlotPrice = selectedPlotObj?.totalPrice || 0;
  const advanceAmount = parseFloat(form.bookingAmount) || 0;
  const calculatedBalance = Math.max(0, totalPlotPrice - advanceAmount);

  const handleCustomerSelect = (custId: string) => {
    if (!custId) {
      setForm({ ...form, customerId: "", customerName: "", customerPhone: "" });
      return;
    }
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setForm({
        ...form,
        customerId: found.id,
        customerName: found.name,
        customerPhone: found.phone,
      });
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      // Refetch
      const fetchRes = await fetch("/api/admin/bookings");
      const fetchData = await fetchRes.json();
      setBookings(fetchData.bookings || []);

      setIsAddModalOpen(false);
      alert(`Booking ${data.booking.bookingNumber} confirmed! Receipt: ${data.receiptNumber}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id: string, bookingNo: string) => {
    const reason = prompt(`Enter cancellation reason for ${bookingNo}:`);
    if (reason === null) return;

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "CANCEL", cancelReason: reason || "Cancelled by Admin" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b))
      );
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveBooking = async (id: string) => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "APPROVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve booking");

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "CONFIRMED" } : b))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (b: Booking) => {
    setEditingBooking(b);
    setEditForm({
      id: b.id,
      bookingNumber: b.bookingNumber,
      plotNumber: b.plot?.plotNumber || "",
      customerName: b.customerName || b.customer?.name || "",
      customerPhone: b.customerPhone || b.customer?.phone || "",
      customerEmail: b.customerEmail || b.customer?.email || "",
      customerAddress: b.customerAddress || b.customer?.address || "Vatika, Jaipur",
      associateId: b.associate?.id || "",
      totalPlotAmount: String(b.totalPlotAmount || 0),
      bookingAmount: String(b.bookingAmount || 0),
      balanceAmount: String(b.balanceAmount || 0),
      paymentMode: b.paymentMode || "UPI",
      transactionRef: b.transactionRef || "",
      status: b.status || "CONFIRMED",
      agreementStatus: b.agreementStatus || "PENDING",
      notes: b.notes || "",
    });
    setError("");
    setIsEditModalOpen(true);
  };

  const handleEditTotalChange = (val: string) => {
    const total = parseFloat(val) || 0;
    const advance = parseFloat(editForm.bookingAmount) || 0;
    setEditForm((prev) => ({
      ...prev,
      totalPlotAmount: val,
      balanceAmount: String(Math.max(0, total - advance)),
    }));
  };

  const handleEditAdvanceChange = (val: string) => {
    const advance = parseFloat(val) || 0;
    const total = parseFloat(editForm.totalPlotAmount) || 0;
    setEditForm((prev) => ({
      ...prev,
      bookingAmount: val,
      balanceAmount: String(Math.max(0, total - advance)),
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update booking");

      const updated: Booking = data.booking;
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );

      setIsEditModalOpen(false);
      setEditingBooking(null);
    } catch (err: any) {
      setError(err.message || "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerPhone.includes(search) ||
      b.plot?.plotNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Plot Allocations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            New plot booking approvals, payment schedules, and formal booking confirmation receipts.
          </p>
        </div>

        <button
          onClick={() => {
            setError("");
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm shadow-sm transition hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Plot Booking</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking number (SKR-BK-001), customer, or plot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "CONFIRMED", "PENDING_APPROVAL", "CANCELLED", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#0d1b2a] text-amber-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Booking #</th>
                <th className="py-3 px-4">Plot Details</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Associate</th>
                <th className="py-3 px-4">Plot Amount</th>
                <th className="py-3 px-4">Advance Paid</th>
                <th className="py-3 px-4">Balance Remaining</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                    No bookings found. Click &quot;New Plot Booking&quot; to book a plot.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {b.bookingNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 block text-sm">
                        {b.plot?.plotNumber}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {b.plot?.sizeGaj} Gaj • {b.plot?.facing || "East"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{b.customerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{b.customerPhone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {b.associate?.name || "Direct Office"}
                      </span>
                      {b.associate?.memberId && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.associate.memberId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ₹ {b.totalPlotAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹ {b.bookingAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-700">
                      ₹ {b.balanceAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {b.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-amber-200"
                          title="Edit Booking Details"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setSelectedReceiptBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer size={13} />
                          <span>Receipt</span>
                        </button>

                        {b.status === "PENDING_APPROVAL" && (
                          <button
                            onClick={() => handleApproveBooking(b.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                          >
                            Approve
                          </button>
                        )}

                        {b.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancelBooking(b.id, b.bookingNumber)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE BOOKING RECEIPT MODAL                                 */}
      {/* ============================================================== */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative print:shadow-none print:w-full print:max-w-none">
            <button
              onClick={() => setSelectedReceiptBooking(null)}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer print:hidden"
            >
              <X size={20} />
            </button>

            {/* Print Header */}
            <div className="border-b-2 border-[#0d1b2a] pb-4 mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#0d1b2a] tracking-tight font-serif uppercase">
                  Shree Karni Real Estate
                </h2>
                <p className="text-xs font-semibold text-amber-600 tracking-wider">
                  Dream • Invest • Grow
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Head Office: Vatika, Tonk Road, Jaipur, Rajasthan - 303905<br />
                  Contact: +91 8952821872 | info@shreekarnirealestate.in
                </p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded bg-[#0d1b2a] text-amber-400 text-xs font-black uppercase tracking-wider block mb-1">
                  Plot Booking Receipt
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 block">
                  {selectedReceiptBooking.bookingNumber}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Date: {new Date(selectedReceiptBooking.bookingDate).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Buyer & Plot Info Table */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs mb-5">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Customer Details</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedReceiptBooking.customerName}</p>
                <p className="text-slate-600 font-mono">Mobile: {selectedReceiptBooking.customerPhone}</p>
                <p className="text-slate-600">Address: {selectedReceiptBooking.customerAddress || "Vatika, Jaipur"}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Plot Specification</span>
                <p className="text-sm font-black text-blue-900 mt-0.5">Plot No: {selectedReceiptBooking.plot?.plotNumber}</p>
                <p className="text-slate-600">Project: {selectedReceiptBooking.plot?.projectName}</p>
                <p className="text-slate-600 font-medium">
                  Size: {selectedReceiptBooking.plot?.sizeGaj} Gaj • Rate: ₹{selectedReceiptBooking.plot?.pricePerGaj}/Gaj
                </p>
              </div>
            </div>

            {/* Payment Breakdown */}
            <table className="w-full text-xs text-left mb-6 border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-[#0d1b2a] text-white font-bold">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-medium">Total Plot Sale Value</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    ₹ {selectedReceiptBooking.totalPlotAmount?.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="py-2.5 px-3 font-bold text-emerald-800">
                    Booking Advance Received ({selectedReceiptBooking.paymentMode})
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                    ₹ {selectedReceiptBooking.bookingAmount?.toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="py-2.5 px-3 font-bold text-amber-800">
                    Balance Outstanding Payable
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-amber-700">
                    ₹ {selectedReceiptBooking.balanceAmount?.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signatures */}
            <div className="pt-8 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <span>Customer Signature</span>
              </div>
              <div className="text-center">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <span className="font-bold text-[#0d1b2a]">Authorized Signatory</span>
                <span className="block text-[10px] text-slate-400">Shree Karni Real Estate</span>
              </div>
            </div>

            {/* Print Button */}
            <div className="mt-6 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => setSelectedReceiptBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Printer size={15} />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* NEW PLOT BOOKING MODAL                                          */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">New Plot Booking</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select plot, assign customer and sales associate, and record booking advance.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-3.5">
              {/* Select Plot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Available Plot *</label>
                <select
                  required
                  value={form.plotId}
                  onChange={(e) => setForm({ ...form, plotId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                >
                  {availablePlots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.plotNumber} ({p.sizeGaj} Gaj @ ₹{p.pricePerGaj}/Gaj) - Total: ₹{p.totalPrice.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Existing Customer (Optional)</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="">-- New Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerId}) - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mukesh Sharma"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9829012345"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Associate</label>
                  <select
                    value={form.associateId}
                    onChange={(e) => setForm({ ...form, associateId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                  >
                    <option value="">Direct Head Office</option>
                    {associates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.memberId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Booking Advance (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.bookingAmount}
                    onChange={(e) => setForm({ ...form, bookingAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-9283749281 or Cheque #102934"
                  value={form.transactionRef}
                  onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex justify-between items-center text-amber-950 font-medium">
                <span>Total: <strong>₹ {totalPlotPrice.toLocaleString("en-IN")}</strong></span>
                <span>Advance: <strong>₹ {advanceAmount.toLocaleString("en-IN")}</strong></span>
                <span>Balance: <strong className="text-rose-700 font-black">₹ {calculatedBalance.toLocaleString("en-IN")}</strong></span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Confirming Booking..." : "Confirm Plot Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT BOOKING MODAL                                             */}
      {/* ============================================================== */}
      {isEditModalOpen && editingBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingBooking(null);
              }}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                <Edit2 size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Edit Booking: {editForm.bookingNumber}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      editForm.status === "CONFIRMED"
                        ? "bg-emerald-500 text-white"
                        : editForm.status === "CANCELLED"
                        ? "bg-rose-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {editForm.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Plot: <strong className="text-blue-900 font-mono">{editForm.plotNumber}</strong> • Modify customer details, amounts, status, or associate.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Customer Information */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Customer Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.customerName}
                      onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.customerPhone}
                      onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editForm.customerEmail}
                      onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                      placeholder="e.g. client@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Address</label>
                    <input
                      type="text"
                      value={editForm.customerAddress}
                      onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                      placeholder="e.g. Jaipur, Rajasthan"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Financials & Payment Details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Financials & Payment
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editForm.totalPlotAmount}
                      onChange={(e) => handleEditTotalChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Advance Paid (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editForm.bookingAmount}
                      onChange={(e) => handleEditAdvanceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Balance Remaining (₹)</label>
                    <input
                      type="number"
                      value={editForm.balanceAmount}
                      onChange={(e) => setEditForm({ ...editForm, balanceAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-amber-950 font-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={editForm.paymentMode}
                      onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white font-medium"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-9283749281 or Cheque #102934"
                      value={editForm.transactionRef}
                      onChange={(e) => setEditForm({ ...editForm, transactionRef: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Associate Assignment */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Status & Allocation
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Booking Status *</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="CONFIRMED">CONFIRMED (Active Booking)</option>
                      <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                      <option value="COMPLETED">COMPLETED (Fully Paid)</option>
                      <option value="CANCELLED">CANCELLED (Release Plot)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Agreement / Registry Status</label>
                    <select
                      value={editForm.agreementStatus}
                      onChange={(e) => setEditForm({ ...editForm, agreementStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="AGREEMENT_SIGNED">AGREEMENT SIGNED</option>
                      <option value="STAMP_DUTY_PAID">STAMP DUTY PAID</option>
                      <option value="REGISTRY_DONE">REGISTRY DONE (Sold)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Associate</label>
                    <select
                      value={editForm.associateId}
                      onChange={(e) => setEditForm({ ...editForm, associateId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="">-- Direct Office Booking (No Associate) --</option>
                      {associates.map((assoc) => (
                        <option key={assoc.id} value={assoc.id}>
                          {assoc.name} ({assoc.memberId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Booking Notes / Remarks</label>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Add any special notes or payment schedule agreements..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBooking(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  <Save size={14} />
                  <span>{loading ? "Saving Changes..." : "Save Booking Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
