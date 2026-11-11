"use client";

import { useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  X,
  CreditCard,
  Edit2,
  Check,
  Trash2,
  Save,
} from "lucide-react";

interface Incentive {
  id: string;
  associateId: string;
  associate: {
    id: string;
    name: string;
    memberId: string;
    phone?: string | null;
    rank?: string | null;
    walletBalance?: number;
  };
  amount: number;
  type: string; // SALE, REFERRAL, BONUS, RANK_ACHIEVEMENT
  description?: string | null;
  status: string; // PENDING, APPROVED, PAID
  createdAt: string;
}

interface CommissionRule {
  id: string;
  rank: string;
  directPercent: number;
  teamPercent: number;
  fixedPerGaj: number | null;
  bonusThreshold: number | null;
  bonusAmount: number | null;
}

interface CommissionSlab {
  id: string;
  rangeLabel: string;
  minSqYard: number;
  maxSqYard: number | null;
  associateRate: number;
  teamLeaderRate?: number | null;
  totalRate?: number | null;
}

interface AdminCommissionsManagerProps {
  initialIncentives: Incentive[];
  initialRules: CommissionRule[];
  initialSlabs?: CommissionSlab[];
  totalPaid: number;
  totalApproved: number;
  totalPending: number;
}

export default function AdminCommissionsManager({
  initialIncentives,
  initialRules,
  initialSlabs = [],
  totalPaid,
  totalApproved,
  totalPending,
}: AdminCommissionsManagerProps) {
  const [incentives, setIncentives] = useState<Incentive[]>(initialIncentives);
  const [rules, setRules] = useState<CommissionRule[]>(initialRules);
  const [slabs, setSlabs] = useState<CommissionSlab[]>(initialSlabs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"queue" | "rules">("queue");
  const [rulesSubTab, setRulesSubTab] = useState<"slabs" | "ranks">("slabs");

  // Slab State
  const [editingSlab, setEditingSlab] = useState<CommissionSlab | null>(null);
  const [isAddSlabModalOpen, setIsAddSlabModalOpen] = useState(false);
  const [slabLoading, setSlabLoading] = useState(false);
  const [slabError, setSlabError] = useState("");
  const [slabForm, setSlabForm] = useState({
    id: "",
    rangeLabel: "",
    minSqYard: "0",
    maxSqYard: "",
    associateRate: "500",
    teamLeaderRate: "1000",
    totalRate: "1500",
  });
  const [deleteSlabLoadingId, setDeleteSlabLoadingId] = useState<string | null>(null);

  // Commission Rule State
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [loading, setLoading] = useState(false);

  // Add Commission Rule State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addForm, setAddForm] = useState({
    rank: "",
    directPercent: "5.0",
    teamPercent: "2.0",
    fixedPerGaj: "150",
    bonusThreshold: "1000000",
    bonusAmount: "25000",
  });

  // Delete State
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/commissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update commission");

      setIncentives((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      );
      alert(`Commission marked as ${newStatus}!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEditSlab = (slab: CommissionSlab) => {
    setEditingSlab(slab);
    setSlabError("");
    setSlabForm({
      id: slab.id,
      rangeLabel: slab.rangeLabel,
      minSqYard: slab.minSqYard.toString(),
      maxSqYard: slab.maxSqYard !== null && slab.maxSqYard !== undefined ? slab.maxSqYard.toString() : "",
      associateRate: slab.associateRate.toString(),
      teamLeaderRate: slab.teamLeaderRate ? slab.teamLeaderRate.toString() : "0",
      totalRate: slab.totalRate ? slab.totalRate.toString() : "1500",
    });
  };

  const handleSaveSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slabForm.rangeLabel.trim()) {
      setSlabError("Range label is required");
      return;
    }
    setSlabLoading(true);
    setSlabError("");

    try {
      const res = await fetch("/api/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SLAB", ...slabForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save commission slab");

      setSlabs((prev) => {
        const withoutOld = prev.filter((s) => s.id !== data.slab.id && s.rangeLabel !== data.slab.rangeLabel);
        return [...withoutOld, data.slab].sort((a, b) => a.minSqYard - b.minSqYard);
      });

      setEditingSlab(null);
      setIsAddSlabModalOpen(false);
      alert(data.message || `Commission slab "${data.slab.rangeLabel}" saved successfully!`);
    } catch (err: any) {
      setSlabError(err.message);
    } finally {
      setSlabLoading(false);
    }
  };

  const handleDeleteSlab = async (slab: CommissionSlab) => {
    if (!window.confirm(`Are you sure you want to delete commission slab "${slab.rangeLabel}"?`)) {
      return;
    }

    setDeleteSlabLoadingId(slab.id);
    try {
      const res = await fetch(`/api/admin/commissions?type=SLAB&id=${slab.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete slab");

      setSlabs((prev) => prev.filter((s) => s.id !== slab.id));
      if (editingSlab?.id === slab.id) setEditingSlab(null);
      alert(data.message || `Commission slab "${slab.rangeLabel}" deleted!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteSlabLoadingId(null);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRule),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update commission rule");

      setRules((prev) =>
        prev.map((r) => (r.id === editingRule.id ? data.rule : r))
      );
      setEditingRule(null);
      alert("Commission rule updated successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.rank.trim()) {
      setAddError("Please specify a rank name");
      return;
    }
    setAddLoading(true);
    setAddError("");

    try {
      const res = await fetch("/api/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create commission rule");

      setRules((prev) => {
        const withoutSameRank = prev.filter((r) => r.rank.toLowerCase() !== data.rule.rank.toLowerCase());
        return [...withoutSameRank, data.rule].sort((a, b) => a.directPercent - b.directPercent);
      });

      setIsAddModalOpen(false);
      setAddForm({
        rank: "",
        directPercent: "5.0",
        teamPercent: "2.0",
        fixedPerGaj: "150",
        bonusThreshold: "1000000",
        bonusAmount: "25000",
      });
      alert(`Commission rule for "${data.rule.rank}" added successfully!`);
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteRule = async (rule: CommissionRule) => {
    if (!window.confirm(`Are you sure you want to permanently delete the commission rule for "${rule.rank}"?`)) {
      return;
    }

    setDeleteLoadingId(rule.id);
    try {
      const res = await fetch(`/api/admin/commissions?id=${rule.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete commission rule");

      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      if (editingRule?.id === rule.id) {
        setEditingRule(null);
      }
      alert(data.message || `Commission rule for "${rule.rank}" deleted!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const filtered = incentives.filter((i) => {
    const matchesSearch =
      i.associate?.name.toLowerCase().includes(search.toLowerCase()) ||
      i.associate?.memberId.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Commission Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Direct & Team Rules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure direct & team commission percentages, approve payout vouchers, and disburse to associate wallets.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "queue"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Commission Queue ({incentives.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "rules"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Commission Rules ({rules.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Approval</span>
          <div className="text-2xl font-black text-amber-600 mt-1">₹ {totalPending.toLocaleString("en-IN")}</div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Awaiting admin sign-off</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Approved (Pending Payout)</span>
          <div className="text-2xl font-black text-blue-600 mt-1">₹ {totalApproved.toLocaleString("en-IN")}</div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Ready for wallet disbursement</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Disbursed / Paid</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹ {totalPaid.toLocaleString("en-IN")}</div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Credited to associate wallets</p>
        </div>
      </div>

      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search associate name or member ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "PENDING", "APPROVED", "PAID"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#0d1b2a] text-amber-400"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Associate</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                        No commission entries found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{inc.associate?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {inc.associate?.memberId} • {inc.associate?.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800">
                            {inc.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {inc.description || "Plot sale commission"}
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                          ₹ {inc.amount?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              inc.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : inc.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(inc.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inc.status === "PENDING" && (
                              <button
                                onClick={() => handleStatusChange(inc.id, "APPROVED")}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] hover:bg-blue-100 transition cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {inc.status !== "PAID" && (
                              <button
                                onClick={() => handleStatusChange(inc.id, "PAID")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition cursor-pointer"
                              >
                                Pay Out
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
        </div>
      )}

      {/* Rules Configurator Tab */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setRulesSubTab("slabs")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                rulesSubTab === "slabs"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📊 Sales Volume Slabs (Per Sq. Yard / Gaj)
            </button>
            <button
              onClick={() => setRulesSubTab("ranks")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                rulesSubTab === "ranks"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎖️ Rank-Wise % Matrix
            </button>
          </div>

          {/* Slabs Tab View */}
          {rulesSubTab === "slabs" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">Associate Sales Volume Commission Slabs</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Per Sq. Yard (GAJ) Rules
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Associate commission is awarded based on total cumulative square yards sold, scaling progressively from ₹500 to ₹1,500/Gaj.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSlabError("");
                    setSlabForm({
                      id: "",
                      rangeLabel: "",
                      minSqYard: "0",
                      maxSqYard: "",
                      associateRate: "500",
                      teamLeaderRate: "1000",
                      totalRate: "1500",
                    });
                    setIsAddSlabModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-sm self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Add Commission Slab</span>
                </button>
              </div>

              {/* Slabs Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0d1b2a] text-white uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Total Sales Range (In Square Yard / Gaj)</th>
                      <th className="py-3 px-4 text-center">Associate Commission (₹ / Sq. Yard)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {slabs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          No commission slabs defined yet. Click &quot;Add Commission Slab&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      slabs.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-amber-50/40 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                            <span className="font-mono text-slate-800">{s.rangeLabel}</span>{" "}
                            <span className="text-[11px] font-medium text-slate-400">Sq. Yard</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                              ₹ {s.associateRate?.toLocaleString("en-IN")} / Gaj
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditSlab(s)}
                                className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                title="Edit Slab Rate"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSlab(s)}
                                disabled={deleteSlabLoadingId === s.id}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                                title="Delete Slab"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footnotes Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-600 font-bold">✓</span> All fees and charges are inclusive of taxes.
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <span className="text-emerald-600 font-bold">✓</span> In case of non-payment, Late Payment Charges shall be levied according to company terms.
                </p>
              </div>
            </div>
          )}

          {/* Rank Matrix Tab View */}
          {rulesSubTab === "ranks" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rank-Wise Percentage Commission Matrix</h3>
                  <p className="text-xs text-slate-500">
                    Configure direct sales percentage, team downline overrides, and milestone bonuses.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-sm self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Add Commission Rule</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rules.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-amber-400 transition space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <h4 className="font-bold text-slate-900 text-sm">{r.rank}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingRule(r)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-white transition cursor-pointer"
                          title="Edit Commission Rule"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(r)}
                          disabled={deleteLoadingId === r.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition cursor-pointer disabled:opacity-50"
                          title="Delete Commission Rule"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Direct Comm.</span>
                        <span className="text-base font-black text-blue-700">{r.directPercent}%</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Team Comm.</span>
                        <span className="text-base font-black text-purple-700">{r.teamPercent}%</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fixed / Gaj</span>
                        <span className="font-bold text-slate-900">₹ {r.fixedPerGaj ?? 100}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-xs">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Bonus</span>
                        <span className="font-bold text-emerald-700">₹ {((r.bonusAmount ?? 25000) / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD COMMISSION SLAB MODAL                                      */}
      {/* ============================================================== */}
      {isAddSlabModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsAddSlabModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Plus size={16} />
              </span>
              <h3 className="text-lg font-black text-slate-900">Add Sales Commission Slab</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Create a progressive commission slab based on square yards (Gaj) sold.
            </p>

            {slabError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {slabError}
              </div>
            )}

            <form onSubmit={handleSaveSlab} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sales Range Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0 - 249, 250 - 499, 10000 and Above"
                  value={slabForm.rangeLabel}
                  onChange={(e) => setSlabForm({ ...slabForm, rangeLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Sq. Yard (Gaj) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={slabForm.minSqYard}
                    onChange={(e) => setSlabForm({ ...slabForm, minSqYard: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Sq. Yard (Leave empty for &quot;and Above&quot;)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 249 (or empty)"
                    value={slabForm.maxSqYard}
                    onChange={(e) => setSlabForm({ ...slabForm, maxSqYard: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Associate Commission Rate (₹ / Sq. Yard) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={slabForm.associateRate}
                  onChange={(e) => setSlabForm({ ...slabForm, associateRate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-black text-sm text-emerald-800"
                  placeholder="e.g. 500, 700, 1000, 1500"
                />
                <span className="text-[10px] text-slate-400">Commission rate per Gaj sold for this range</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSlabModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slabLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span>{slabLoading ? "Saving..." : "Create Commission Slab"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT COMMISSION SLAB MODAL                                     */}
      {/* ============================================================== */}
      {editingSlab && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setEditingSlab(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Edit2 size={16} />
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Edit Slab: {editingSlab.rangeLabel} Sq. Yard
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Update the associate per-Gaj rate, team leader override, or sales range.</p>

            {slabError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {slabError}
              </div>
            )}

            <form onSubmit={handleSaveSlab} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sales Range Label *</label>
                <input
                  type="text"
                  required
                  value={slabForm.rangeLabel}
                  onChange={(e) => setSlabForm({ ...slabForm, rangeLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Sq. Yard (Gaj) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={slabForm.minSqYard}
                    onChange={(e) => setSlabForm({ ...slabForm, minSqYard: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Sq. Yard</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave empty for and above"
                    value={slabForm.maxSqYard}
                    onChange={(e) => setSlabForm({ ...slabForm, maxSqYard: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Associate Commission Rate (₹ / Sq. Yard) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={slabForm.associateRate}
                  onChange={(e) => setSlabForm({ ...slabForm, associateRate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-black text-sm text-emerald-800"
                />
                <span className="text-[10px] text-slate-400">Commission rate per Gaj sold for this range</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteSlab(editingSlab)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Slab</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlab(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={slabLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{slabLoading ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD NEW COMMISSION RULE MODAL                                   */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Plus size={16} />
              </span>
              <h3 className="text-lg font-black text-slate-900">Add New Commission Rule</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Create a new associate rank tier with direct commission, downline override, and bonus targets.
            </p>

            {addError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Associate Rank / Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Branch Manager, Zonal Head, Vice President"
                  value={addForm.rank}
                  onChange={(e) => setAddForm({ ...addForm, rank: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                />
                {/* Quick suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] text-slate-400">Suggestions:</span>
                  {["Branch Manager", "Zonal Head", "Assistant General Manager", "Vice President", "Executive Director"].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, rank: sug })}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                    >
                      +{sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direct Commission (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={addForm.directPercent}
                    onChange={(e) => setAddForm({ ...addForm, directPercent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Commission on self plot booking</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Commission (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={addForm.teamPercent}
                    onChange={(e) => setAddForm({ ...addForm, teamPercent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Override on team downline sales</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fixed Incentive (₹ / Gaj)</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.fixedPerGaj}
                    onChange={(e) => setAddForm({ ...addForm, fixedPerGaj: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">e.g. ₹150 per Gaj sold</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Reward (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.bonusAmount}
                    onChange={(e) => setAddForm({ ...addForm, bonusAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Target achievement bonus</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Milestone Threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={addForm.bonusThreshold}
                  onChange={(e) => setAddForm({ ...addForm, bonusThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  placeholder="e.g. 1000000"
                />
                <span className="text-[10px] text-slate-400">Total sales volume required to trigger the bonus</span>
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
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span>{addLoading ? "Creating..." : "Create Commission Rule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT COMMISSION RULE MODAL                                      */}
      {/* ============================================================== */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setEditingRule(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Edit2 size={16} />
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Edit Commission: {editingRule.rank}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Set percentage rates, per-Gaj incentives, and bonus criteria.</p>

            <form onSubmit={handleSaveRule} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direct Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingRule.directPercent}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, directPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Self booking commission</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editingRule.teamPercent}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, teamPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Team override commission</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fixed ₹ / GAJ</label>
                  <input
                    type="number"
                    min="0"
                    value={editingRule.fixedPerGaj ?? 100}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, fixedPerGaj: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">₹ per Gaj sold</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Reward (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingRule.bonusAmount ?? 25000}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, bonusAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Bonus incentive</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Milestone Threshold (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editingRule.bonusThreshold ?? 1000000}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, bonusThreshold: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold"
                />
                <span className="text-[10px] text-slate-400">Sales volume to trigger bonus</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteRule(editingRule)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Rule</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{loading ? "Saving..." : "Save Changes"}</span>
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
