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

interface AdminCommissionsManagerProps {
  initialIncentives: Incentive[];
  initialRules: CommissionRule[];
  totalPaid: number;
  totalApproved: number;
  totalPending: number;
}

export default function AdminCommissionsManager({
  initialIncentives,
  initialRules,
  totalPaid,
  totalApproved,
  totalPending,
}: AdminCommissionsManagerProps) {
  const [incentives, setIncentives] = useState<Incentive[]>(initialIncentives);
  const [rules, setRules] = useState<CommissionRule[]>(initialRules);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"queue" | "rules">("queue");
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [loading, setLoading] = useState(false);

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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rank-Wise Commission Matrix</h3>
              <p className="text-xs text-slate-500">
                Direct sales commission, team overrides, and rank achievement bonuses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-amber-400 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{r.rank}</h4>
                  <button
                    onClick={() => setEditingRule(r)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-white transition cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Direct Comm.</span>
                    <span className="text-base font-black text-blue-700">{r.directPercent}%</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Team Comm.</span>
                    <span className="text-base font-black text-purple-700">{r.teamPercent}%</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fixed / Gaj</span>
                    <span className="font-bold text-slate-900">₹ {r.fixedPerGaj || 100}</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bonus</span>
                    <span className="font-bold text-emerald-700">₹ {(r.bonusAmount || 25000) / 1000}k</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingRule(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Edit Commission: {editingRule.rank}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Set percentage rates and per-square-yard incentives.</p>

            <form onSubmit={handleSaveRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direct Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRule.directPercent}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, directPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRule.teamPercent}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, teamPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fixed ₹ / GAJ</label>
                  <input
                    type="number"
                    value={editingRule.fixedPerGaj || 100}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, fixedPerGaj: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Amount (₹)</label>
                  <input
                    type="number"
                    value={editingRule.bonusAmount || 25000}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, bonusAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
