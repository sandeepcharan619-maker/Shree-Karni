"use client";

import { useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  CreditCard,
  Banknote,
  Download,
  Building2,
  AlertCircle,
  TrendingUp,
  Edit2,
  Trash2,
  Save,
} from "lucide-react";

interface Payment {
  id: string;
  receiptNumber: string;
  bookingId?: string | null;
  booking?: {
    id: string;
    bookingNumber: string;
    totalPlotAmount: number;
    balanceAmount: number;
    status: string;
  } | null;
  customerId?: string | null;
  customer?: {
    id: string;
    customerId: string;
    name: string;
    phone: string;
    email?: string | null;
  } | null;
  plotId?: string | null;
  plot?: {
    id: string;
    plotNumber: string;
    projectName: string;
    location: string;
    sizeGaj: number;
  } | null;
  amount: number;
  paymentType: string;
  paymentMode: string;
  transactionRef?: string | null;
  bankName?: string | null;
  status: string;
  collectedBy?: {
    id: string;
    name: string;
    memberId: string;
  } | null;
  receiptDate: string;
  remarks?: string | null;
}

interface AdminPaymentsManagerProps {
  initialPayments: Payment[];
  bookings: {
    id: string;
    bookingNumber: string;
    customerName: string;
    customerPhone: string;
    totalPlotAmount: number;
    balanceAmount: number;
    plot: { plotNumber: string; projectName: string };
  }[];
  totalCollected: number;
  modeTotals: {
    UPI: number;
    CASH: number;
    CHEQUE: number;
    BANK_TRANSFER: number;
  };
}

export default function AdminPaymentsManager({
  initialPayments,
  bookings,
  totalCollected,
  modeTotals,
}: AdminPaymentsManagerProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit Payment State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    id: "",
    amount: "",
    paymentType: "INSTALLMENT",
    paymentMode: "UPI",
    transactionRef: "",
    bankName: "",
    status: "SUCCESS",
    remarks: "",
    receiptDate: "",
  });

  // Delete Payment State
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    bookingId: bookings[0]?.id || "",
    amount: "100000",
    paymentType: "INSTALLMENT",
    paymentMode: "UPI",
    transactionRef: "",
    bankName: "",
    remarks: "Installment payment received",
  });

  const selectedBookingObj = bookings.find((b) => b.id === form.bookingId);

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");

      const fetchRes = await fetch("/api/admin/payments");
      const fetchData = await fetchRes.json();
      setPayments(fetchData.payments || []);

      setIsCollectModalOpen(false);
      alert(`Payment of ₹${parseFloat(form.amount).toLocaleString("en-IN")} recorded! Receipt: ${data.payment.receiptNumber}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (p: Payment) => {
    setEditingPayment(p);
    setEditError("");
    setEditForm({
      id: p.id,
      amount: p.amount ? p.amount.toString() : "0",
      paymentType: p.paymentType || "INSTALLMENT",
      paymentMode: p.paymentMode || "UPI",
      transactionRef: p.transactionRef || "",
      bankName: p.bankName || "",
      status: p.status || "SUCCESS",
      remarks: p.remarks || "",
      receiptDate: p.receiptDate ? new Date(p.receiptDate).toISOString().split("T")[0] : "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch("/api/admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update payment");

      // Update payments in state
      if (data.payment) {
        setPayments((prev) =>
          prev.map((item) => (item.id === data.payment.id ? { ...item, ...data.payment } : item))
        );
      } else {
        const fetchRes = await fetch("/api/admin/payments");
        const fetchData = await fetchRes.json();
        setPayments(fetchData.payments || []);
      }

      setIsEditModalOpen(false);
      alert(data.message || "Payment updated successfully!");
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePayment = async (p: Payment) => {
    const confirmMsg = `Are you sure you want to permanently delete payment receipt "${p.receiptNumber}" (₹${p.amount?.toLocaleString("en-IN")})?\n\nIf linked to a booking, the remaining balance will be automatically recalculated.`;
    if (!window.confirm(confirmMsg)) return;

    setDeleteLoadingId(p.id);

    try {
      const res = await fetch(`/api/admin/payments?id=${p.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete payment");

      setPayments((prev) => prev.filter((item) => item.id !== p.id));
      if (isEditModalOpen && editingPayment?.id === p.id) {
        setIsEditModalOpen(false);
      }
      alert(data.message || "Payment deleted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to delete payment");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.plot?.plotNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionRef || "").toLowerCase().includes(search.toLowerCase());

    const matchesMode = modeFilter === "ALL" || p.paymentMode === modeFilter;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Receipts & Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Payment collection ledger, auto-receipt generation (UPI, Cash, Cheque, Bank Transfer), and pending customer installments.
          </p>
        </div>

        <button
          onClick={() => setIsCollectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm shadow-sm transition hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Collect Payment</span>
        </button>
      </div>

      {/* Collection KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1e293b] rounded-2xl p-4 text-white shadow-sm">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Total Collections</span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-2">
            ₹ {(totalCollected / 100000).toFixed(2)} L
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">₹ {totalCollected.toLocaleString("en-IN")}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">UPI / Online</span>
          <div className="text-xl font-black text-slate-900 mt-2">
            ₹ {(modeTotals.UPI / 100000).toFixed(2)} L
          </div>
          <p className="text-[11px] text-blue-600 mt-0.5 font-medium">Google Pay / PhonePe</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Bank Transfer</span>
          <div className="text-xl font-black text-slate-900 mt-2">
            ₹ {(modeTotals.BANK_TRANSFER / 100000).toFixed(2)} L
          </div>
          <p className="text-[11px] text-purple-600 mt-0.5 font-medium">NEFT / RTGS / IMPS</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cheque</span>
          <div className="text-xl font-black text-slate-900 mt-2">
            ₹ {(modeTotals.CHEQUE / 100000).toFixed(2)} L
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Bank Cheque</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cash</span>
          <div className="text-xl font-black text-slate-900 mt-2">
            ₹ {(modeTotals.CASH / 100000).toFixed(2)} L
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Head Office Vault</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt number (SKR-REC-001), customer, or txn ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "UPI", "BANK_TRANSFER", "CHEQUE", "CASH"].map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                modeFilter === m
                  ? "bg-[#0d1b2a] text-amber-400"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {m.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Plot / Project</th>
                <th className="py-3 px-4">Amount Collected</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                    No payment records found. Click &quot;Collect Payment&quot; above to issue a receipt.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">
                        {p.customer?.name || "Property Buyer"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {p.customer?.phone || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700 block">
                        {p.plot?.plotNumber || "Plot"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {p.plot?.projectName || "Shree Karni Township"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                      ₹ {p.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {p.transactionRef || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.receiptDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title="Print Official Payment Receipt"
                        >
                          <Printer size={13} />
                          <span className="hidden sm:inline">Print</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title="Edit Payment Details"
                        >
                          <Edit2 size={13} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p)}
                          disabled={deleteLoadingId === p.id}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                          title="Delete Payment Record"
                        >
                          <Trash2 size={13} />
                          <span className="hidden sm:inline">{deleteLoadingId === p.id ? "..." : "Delete"}</span>
                        </button>
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
      {/* PRINTABLE OFFICIAL PAYMENT RECEIPT MODAL                       */}
      {/* ============================================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative print:shadow-none print:w-full print:max-w-none border border-slate-200">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer print:hidden"
            >
              <X size={20} />
            </button>

            {/* Receipt Header */}
            <div className="border-b-2 border-[#0d1b2a] pb-4 mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-[#0d1b2a] tracking-tight font-serif uppercase">
                  Shree Karni Real Estate
                </h2>
                <p className="text-[11px] font-semibold text-amber-600 tracking-wider">
                  Dream • Invest • Grow
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Vatika, Tonk Road, Jaipur, Rajasthan - 303905<br />
                  Phone: +91 8952821872
                </p>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider block mb-1">
                  Payment Receipt
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  {selectedReceipt.receiptNumber}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Date: {new Date(selectedReceipt.receiptDate).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="space-y-3 text-xs text-slate-800">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Received From</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedReceipt.customer?.name || "Customer"}</span>
                  <span className="text-slate-500 block font-mono">{selectedReceipt.customer?.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">For Plot</span>
                  <span className="font-black text-blue-900 text-sm">{selectedReceipt.plot?.plotNumber || "Plot Booking"}</span>
                  <span className="text-slate-500 block">{selectedReceipt.plot?.projectName}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-center">
                <span className="text-emerald-800 text-[10px] font-bold uppercase tracking-wider block">Amount Received</span>
                <span className="text-2xl font-black text-emerald-800 block my-1">
                  ₹ {selectedReceipt.amount?.toLocaleString("en-IN")}
                </span>
                <span className="text-emerald-900 text-[11px] font-medium block">
                  Mode: {selectedReceipt.paymentMode} • Ref: {selectedReceipt.transactionRef || "N/A"}
                </span>
              </div>

              {selectedReceipt.remarks && (
                <p className="text-[11px] text-slate-600 italic">
                  <strong>Remarks:</strong> {selectedReceipt.remarks}
                </p>
              )}
            </div>

            {/* Signature & Seal */}
            <div className="pt-8 mt-6 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200">
              <div className="text-center">
                <div className="w-28 border-b border-slate-400 mb-1" />
                <span className="text-[10px]">Customer Copy</span>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1" />
                <span className="font-bold text-[#0d1b2a] text-[11px]">Authorized Signatory</span>
                <span className="block text-[9px] text-slate-400">Shree Karni Real Estate</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setSelectedReceipt(null)}
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
      {/* COLLECT PAYMENT MODAL                                          */}
      {/* ============================================================== */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCollectModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Collect Customer Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select customer booking, record collected amount, and generate official receipt.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCollectPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Booking / Customer *</label>
                <select
                  required
                  value={form.bookingId}
                  onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookingNumber} - {b.customerName} ({b.plot?.plotNumber}) - Bal: ₹{b.balanceAmount.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBookingObj && (
                <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900 flex justify-between items-center font-medium">
                  <span>Plot: <strong>{selectedBookingObj.plot?.plotNumber}</strong></span>
                  <span>Total: <strong>₹ {selectedBookingObj.totalPlotAmount.toLocaleString("en-IN")}</strong></span>
                  <span>Remaining: <strong className="text-rose-700 font-black">₹ {selectedBookingObj.balanceAmount.toLocaleString("en-IN")}</strong></span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-39824982 or Cheque #102934"
                    value={form.transactionRef}
                    onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, SBI"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Record Payment & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT PAYMENT MODAL                                             */}
      {/* ============================================================== */}
      {isEditModalOpen && editingPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Edit2 size={16} />
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Edit Payment ({editingPayment.receiptNumber})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Modify payment details, update amount, mode, or verify transaction status.
            </p>

            {/* Context Badge */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mb-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer / Plot</span>
                <span className="font-bold text-slate-900">
                  {editingPayment.customer?.name || "Customer"}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  Plot: <strong className="text-blue-700">{editingPayment.plot?.plotNumber || "N/A"}</strong> ({editingPayment.plot?.projectName || "Township"})
                </span>
              </div>
              {editingPayment.booking && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Booking</span>
                  <span className="font-mono font-bold text-slate-800">{editingPayment.booking.bookingNumber}</span>
                  <span className="block text-[10px] text-slate-500">
                    Bal: ₹{editingPayment.booking.balanceAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            {editError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={editForm.paymentMode}
                    onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={editForm.paymentType}
                    onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  >
                    <option value="BOOKING_ADVANCE">Booking Advance</option>
                    <option value="INSTALLMENT">Installment</option>
                    <option value="FULL_PAYMENT">Full Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  >
                    <option value="SUCCESS">SUCCESS (Verified)</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                  <input
                    type="text"
                    value={editForm.transactionRef}
                    onChange={(e) => setEditForm({ ...editForm, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-mono"
                    placeholder="e.g. TXN-1294829"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    placeholder="e.g. SBI, HDFC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    value={editForm.receiptDate}
                    onChange={(e) => setEditForm({ ...editForm, receiptDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    placeholder="Notes or remarks"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => handleDeletePayment(editingPayment)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Receipt</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{editLoading ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
