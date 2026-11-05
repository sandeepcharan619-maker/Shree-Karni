"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  X,
  CreditCard,
  Receipt,
  Download,
  AlertCircle,
  Trash2,
  Save,
} from "lucide-react";

interface Customer {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  agreementStatus: string; // PENDING, AGREEMENT_SIGNED, REGISTRY_DONE, MUTATION_DONE
  registryDate: string | null;
  notes: string | null;
  totalBookedValue: number;
  totalPaid: number;
  totalOutstanding: number;
  assignedAssociate?: { id: string; name: string; memberId: string; phone: string | null } | null;
  bookings: any[];
  payments: any[];
}

interface AdminCustomersManagerProps {
  initialCustomers: Customer[];
  associates: { id: string; name: string; memberId: string }[];
}

export default function AdminCustomersManager({
  initialCustomers,
  associates,
}: AdminCustomersManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "Vatika, Tonk Road, Jaipur",
    panNumber: "",
    aadhaarNumber: "",
    agreementStatus: "PENDING",
    assignedAssociateId: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    customerId: "",
    name: "",
    phone: "",
    email: "",
    address: "Vatika, Tonk Road, Jaipur",
    panNumber: "",
    aadhaarNumber: "",
    agreementStatus: "PENDING",
    registryDate: "",
    assignedAssociateId: "",
    notes: "",
  });

  const openAddModal = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "Vatika, Tonk Road, Jaipur",
      panNumber: "",
      aadhaarNumber: "",
      agreementStatus: "PENDING",
      assignedAssociateId: "",
      notes: "",
    });
    setError("");
    setIsAddModalOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create customer");

      const fetchRes = await fetch("/api/admin/customers");
      const fetchData = await fetchRes.json();
      setCustomers(fetchData.customers || []);

      setIsAddModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, agreementStatus: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, agreementStatus: newStatus } : c))
      );

      if (selectedCustomer?.id === id) {
        setSelectedCustomer({ ...selectedCustomer, agreementStatus: newStatus });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditForm({
      id: c.id,
      customerId: c.customerId,
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "Vatika, Tonk Road, Jaipur",
      panNumber: c.panNumber || "",
      aadhaarNumber: c.aadhaarNumber || "",
      agreementStatus: c.agreementStatus || "PENDING",
      registryDate: c.registryDate ? new Date(c.registryDate).toISOString().split("T")[0] : "",
      assignedAssociateId: c.assignedAssociate?.id || "",
      notes: c.notes || "",
    });
    setError("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update customer");

      const updated: Customer = data.customer;
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );

      if (selectedCustomer?.id === updated.id) {
        setSelectedCustomer({ ...selectedCustomer, ...updated });
      }

      setIsEditModalOpen(false);
      setEditingCustomer(null);
    } catch (err: any) {
      setError(err.message || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string, customerId: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete customer "${name}" (${customerId})?\n\nThis will remove their customer profile, payment records, and restore any linked plots back to Available.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/customers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete customer");

      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
      if (editingCustomer?.id === id) {
        setIsEditModalOpen(false);
        setEditingCustomer(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete customer");
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.customerId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.agreementStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Registry & Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered property buyers, agreement execution, sub-registrar registry milestones, and customer payment histories.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm shadow-sm transition hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, or ID (CUST-1001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "AGREEMENT_SIGNED", "REGISTRY_DONE", "MUTATION_DONE"].map((st) => (
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

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Booked Plots</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Outstanding</th>
                <th className="py-3 px-4">Registry Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                    No customers found. Click &quot;Register Customer&quot; above to add.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {c.customerId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[150px] block">
                        {c.address || "Jaipur, Rajasthan"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block font-mono">{c.phone}</span>
                      {c.email && <span className="text-[10px] text-slate-500 block">{c.email}</span>}
                    </td>
                    <td className="py-3 px-4">
                      {c.bookings.length > 0 ? (
                        c.bookings.map((b) => (
                          <span
                            key={b.id}
                            className="inline-block px-2 py-0.5 mr-1 mb-1 bg-blue-50 border border-blue-200 text-blue-800 rounded font-mono text-[10px] font-bold"
                          >
                            {b.plot?.plotNumber}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No bookings</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹ {c.totalBookedValue?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹ {c.totalPaid?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-700">
                      ₹ {c.totalOutstanding?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={c.agreementStatus}
                        onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer ${
                          c.agreementStatus === "REGISTRY_DONE" || c.agreementStatus === "MUTATION_DONE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : c.agreementStatus === "AGREEMENT_SIGNED"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="AGREEMENT_SIGNED">AGREEMENT SIGNED</option>
                        <option value="REGISTRY_DONE">REGISTRY DONE</option>
                        <option value="MUTATION_DONE">MUTATION DONE</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-amber-200"
                          title="Edit Customer"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0d1b2a] hover:text-amber-400 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name, c.customerId)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-rose-200"
                          title="Delete Customer"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
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

      {/* Customer Profile Inspection Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 font-black text-lg flex items-center justify-center">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {selectedCustomer.customerId}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.phone} • {selectedCustomer.email || "No email"}
                </p>
              </div>
            </div>

            {/* Stepper Status */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Agreement & Registry Workflow
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                <div
                  className={`p-2 rounded-xl ${
                    ["PENDING", "AGREEMENT_SIGNED", "REGISTRY_DONE", "MUTATION_DONE"].includes(
                      selectedCustomer.agreementStatus
                    )
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  1. Token
                </div>
                <div
                  className={`p-2 rounded-xl ${
                    ["AGREEMENT_SIGNED", "REGISTRY_DONE", "MUTATION_DONE"].includes(
                      selectedCustomer.agreementStatus
                    )
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  2. Agreement
                </div>
                <div
                  className={`p-2 rounded-xl ${
                    ["REGISTRY_DONE", "MUTATION_DONE"].includes(selectedCustomer.agreementStatus)
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  3. Registry Done
                </div>
                <div
                  className={`p-2 rounded-xl ${
                    selectedCustomer.agreementStatus === "MUTATION_DONE"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  4. Dakhil Kharij
                </div>
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-center text-xs mb-4">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Plot Value</span>
                <span className="font-black text-slate-900 text-sm">₹ {selectedCustomer.totalBookedValue?.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Total Paid</span>
                <span className="font-black text-emerald-700 text-sm">₹ {selectedCustomer.totalPaid?.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[10px] uppercase font-bold">Balance Remaining</span>
                <span className="font-black text-amber-700 text-sm">₹ {selectedCustomer.totalOutstanding?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Address & KYC */}
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 mb-4">
              <p><strong>Address:</strong> {selectedCustomer.address || "Vatika, Jaipur"}</p>
              <p><strong>PAN:</strong> {selectedCustomer.panNumber || "Not submitted"}</p>
              <p><strong>Aadhaar:</strong> {selectedCustomer.aadhaarNumber || "Not submitted"}</p>
              {selectedCustomer.notes && <p><strong>Notes:</strong> {selectedCustomer.notes}</p>}
            </div>

            {/* Payments List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Payment History ({selectedCustomer.payments?.length || 0})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs">
                {selectedCustomer.payments?.map((p) => (
                  <div key={p.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{p.receiptNumber}</span>
                      <span className="text-[10px] text-slate-400 block">{new Date(p.receiptDate).toLocaleDateString("en-IN")} via {p.paymentMode}</span>
                    </div>
                    <span className="font-bold text-emerald-700">₹ {p.amount?.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name, selectedCustomer.customerId)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Customer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleOpenEdit(selectedCustomer);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Register New Customer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter customer personal details, address, and KYC identifiers.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9829012345"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="ramesh@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address in Jaipur</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCPS1234F"
                    value={form.panNumber}
                    onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012"
                    value={form.aadhaarNumber}
                    onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                  />
                </div>
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
                  {loading ? "Registering..." : "Register Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT CUSTOMER MODAL                                            */}
      {/* ============================================================== */}
      {isEditModalOpen && editingCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingCustomer(null);
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
                    Edit Customer: {editForm.name || editingCustomer.name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {editForm.customerId}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Update customer contact information, KYC documents, or legal status.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Personal & Contact Information */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Personal & Contact Information
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="e.g. customer@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="e.g. Vatika, Tonk Road, Jaipur"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* KYC & Identification */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  KYC & Identification Numbers
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ABCDE1234F"
                      value={editForm.panNumber}
                      onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234 5678 9012"
                      value={editForm.aadhaarNumber}
                      onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Legal & Agreement Workflow */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Agreement & Associate Assignment
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Agreement Status</label>
                    <select
                      value={editForm.agreementStatus}
                      onChange={(e) => setEditForm({ ...editForm, agreementStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="PENDING">PENDING (Token stage)</option>
                      <option value="AGREEMENT_SIGNED">AGREEMENT SIGNED</option>
                      <option value="REGISTRY_DONE">REGISTRY DONE (Sale registered)</option>
                      <option value="MUTATION_DONE">MUTATION DONE (Dakhil Kharij)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Associate</label>
                    <select
                      value={editForm.assignedAssociateId}
                      onChange={(e) => setEditForm({ ...editForm, assignedAssociateId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="">-- Direct Customer (Office) --</option>
                      {associates.map((assoc) => (
                        <option key={assoc.id} value={assoc.id}>
                          {assoc.name} ({assoc.memberId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Customer requirements, preferred sector, or follow-up notes..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (editingCustomer) handleDeleteCustomer(editingCustomer.id, editingCustomer.name, editingCustomer.customerId);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Customer</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingCustomer(null);
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
                    <span>{loading ? "Saving Changes..." : "Save Customer Changes"}</span>
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
