"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import AddAssociateModal from "@/app/admin/associates/AddAssociateModal";
import EditAssociateModal from "@/app/admin/associates/EditAssociateModal";
import AssociateRowActions from "@/app/admin/associates/AssociateRowActions";
import { Search, Users, CheckCircle2, Edit3, Sparkles } from "lucide-react";

export interface AssociateItem {
  id: string;
  name: string;
  username: string;
  memberId: string;
  phone?: string | null;
  email?: string | null;
  rank: string;
  isActive: boolean;
  walletBalance: number;
  customDownline?: number | null;
  customSalesGaj?: number | null;
  referredById?: string | null;
  referredBy?: { id?: string; name: string; memberId: string } | null;
  _count?: { referrals: number; sales: number };
  createdAt?: string | Date;
}

const STORAGE_KEY = "shreekarni_custom_associates_v1";

const SAMPLE_USERNAMES = new Set(["rajesh.sharma", "priya.verma", "amit.kumar"]);

function isSampleAssociate(item: AssociateItem): boolean {
  if (!item) return false;
  if (item.username && SAMPLE_USERNAMES.has(item.username.toLowerCase())) return true;
  return false;
}

export default function AssociatesManager({
  initialAssociates = [],
  title = "All Associates",
  subtitle = "Manage sales team members and downlines",
  maxRows,
}: {
  initialAssociates: AssociateItem[];
  title?: string;
  subtitle?: string;
  maxRows?: number;
}) {
  const [associates, setAssociates] = useState<AssociateItem[]>(() =>
    initialAssociates.filter((item) => !isSampleAssociate(item))
  );
  const [editingAssociate, setEditingAssociate] = useState<AssociateItem | null>(null);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("ALL");
  const [toast, setToast] = useState<string | null>(null);

  // Sync with persistent browser storage and fetch live DB on mount
  useEffect(() => {
    // 1. Purge legacy sample associates from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const localList: AssociateItem[] = JSON.parse(stored);
        if (Array.isArray(localList)) {
          const cleaned = localList.filter((item) => !isSampleAssociate(item));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          if (cleaned.length > 0) {
            setAssociates((prev) => {
              const map = new Map<string, AssociateItem>();
              prev.forEach((item) => {
                if (!isSampleAssociate(item)) map.set((item.memberId || item.id).toUpperCase(), item);
              });
              cleaned.forEach((item) => {
                if (!isSampleAssociate(item)) map.set((item.memberId || item.id).toUpperCase(), item);
              });
              return Array.from(map.values());
            });
          }
        }
      }
    } catch (e) {
      console.warn("Could not load local associates:", e);
    }

    // 2. Fetch live data from /api/admin/associates to ensure complete sync with database
    const fetchLiveAssociates = () => {
      fetch("/api/admin/associates")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data)) {
            const realAssocs = data.filter((item) => !isSampleAssociate(item));
            setAssociates(realAssocs);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(realAssocs));
            } catch (e) {}
          }
        })
        .catch((err) => console.warn("Could not sync associates with server:", err));
    };

    fetchLiveAssociates();
    window.addEventListener("focus", fetchLiveAssociates);

    // Listen to global associate add/delete events
    const handleGlobalAssociateAdded = (e: any) => {
      const newAssoc = e.detail;
      if (newAssoc && !isSampleAssociate(newAssoc)) {
        setAssociates((prev) => {
          const cleanMemberId = (newAssoc.memberId || "").toUpperCase();
          const updated = [newAssoc, ...prev.filter((a) => (a.memberId || "").toUpperCase() !== cleanMemberId)];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        showToast(`Associate ${newAssoc.name} (${newAssoc.memberId}) added to the list!`);
      }
    };

    const handleGlobalAssociateDeleted = (e: any) => {
      const { id, memberId } = e.detail || {};
      setAssociates((prev) => {
        const updated = prev.filter((a) => {
          if (id && a.id === id) return false;
          if (memberId && (a.memberId || "").toUpperCase() === (memberId || "").toUpperCase()) return false;
          return true;
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      showToast("Associate removed successfully.");
    };

    const handleGlobalAssociateUpdated = (e: any) => {
      const updated = e.detail;
      if (updated && (updated.id || updated.memberId)) {
        setAssociates((prev) =>
          prev.map((a) =>
            a.id === updated.id || (a.memberId && a.memberId === updated.memberId)
              ? { ...a, ...updated }
              : a
          )
        );
      }
    };

    window.addEventListener("skr-associate-added", handleGlobalAssociateAdded);
    window.addEventListener("skr-associate-deleted", handleGlobalAssociateDeleted);
    window.addEventListener("skr-associate-updated", handleGlobalAssociateUpdated);

    return () => {
      window.removeEventListener("focus", fetchLiveAssociates);
      window.removeEventListener("skr-associate-added", handleGlobalAssociateAdded);
      window.removeEventListener("skr-associate-deleted", handleGlobalAssociateDeleted);
      window.removeEventListener("skr-associate-updated", handleGlobalAssociateUpdated);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleAssociateCreated = (newAssoc: AssociateItem) => {
    setAssociates((prev) => {
      const cleanMemberId = (newAssoc.memberId || "").toUpperCase();
      const updated = [newAssoc, ...prev.filter((a) => (a.memberId || "").toUpperCase() !== cleanMemberId)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Associate ${newAssoc.name} (${newAssoc.memberId}) added to the list!`);
  };

  const handleAssociateDeleted = (id: string, memberId: string) => {
    setAssociates((prev) => {
      const updated = prev.filter((a) => {
        if (id && a.id === id) return false;
        if (memberId && (a.memberId || "").toUpperCase() === (memberId || "").toUpperCase()) return false;
        return true;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast("Associate removed successfully.");
  };

  const handleAssociateUpdated = (id: string, updates: Partial<AssociateItem>) => {
    setAssociates((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const filtered = associates.filter((assoc) => {
    const matchSearch =
      assoc.name.toLowerCase().includes(search.toLowerCase()) ||
      assoc.username.toLowerCase().includes(search.toLowerCase()) ||
      assoc.memberId.toLowerCase().includes(search.toLowerCase()) ||
      (assoc.phone && assoc.phone.includes(search));

    const matchRank = rankFilter === "ALL" || assoc.rank === rankFilter;
    return matchSearch && matchRank;
  });

  const displayList = maxRows ? filtered.slice(0, maxRows) : filtered;

  const sponsorOptions = associates.map((a) => ({
    id: a.id,
    name: a.name,
    memberId: a.memberId,
  }));

  return (
    <div className="space-y-4">
      {/* Toast alert */}
      {toast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-md flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span className="font-semibold">{toast}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-white/80 hover:text-white text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header with Title and Add Modal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <span>{title} ({associates.length})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <AddAssociateModal
            sponsors={sponsorOptions}
            onSuccess={handleAssociateCreated}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-medium shrink-0">Rank:</span>
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none w-full sm:w-auto cursor-pointer"
          >
            <option value="ALL">All Ranks</option>
            <option value="Client Adviser">Client Adviser</option>
            <option value="Senior Adviser">Senior Adviser</option>
            <option value="Team Leader">Team Leader</option>
            <option value="Branch Manager">Branch Manager</option>
            <option value="Director">Director</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="px-4 py-3 text-left">Member ID</th>
                <th className="px-4 py-3 text-left">Associate Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Referred By</th>
                <th className="px-4 py-3 text-left">Downline</th>
                <th className="px-4 py-3 text-left">Sales</th>
                <th className="px-4 py-3 text-left">Wallet</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                    <p className="font-medium text-gray-700">No associates found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search ? "Try adjusting your search criteria" : "Click '+ Add New Associate' above to register your first associate."}
                    </p>
                  </td>
                </tr>
              ) : (
                displayList.map((assoc) => (
                  <tr key={assoc.id || assoc.memberId} className="hover:bg-blue-50/40 transition group">
                    {/* 1. Member ID (editable) */}
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setEditingAssociate(assoc)}
                        title="Click to edit Member ID"
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                      >
                        <span>{assoc.memberId}</span>
                        <Edit3 size={12} className="opacity-0 group-hover:opacity-100 text-blue-500 transition" />
                      </button>
                    </td>

                    {/* 2. Associate Name (editable) */}
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setEditingAssociate(assoc)}
                        title="Click to edit associate name & details"
                        className="text-left cursor-pointer group/name block"
                      >
                        <div className="font-semibold text-gray-900 group-hover/name:text-blue-600 transition flex items-center gap-1.5">
                          <span>{assoc.name}</span>
                          <Edit3 size={12} className="opacity-0 group-hover/name:opacity-100 text-blue-500 transition" />
                        </div>
                        <div className="text-xs text-gray-400">@{assoc.username}</div>
                      </button>
                    </td>

                    {/* 3. Phone (editable) */}
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                      {assoc.phone ? (
                        <button
                          type="button"
                          onClick={() => setEditingAssociate(assoc)}
                          title="Click to edit phone"
                          className="hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {assoc.phone}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingAssociate(assoc)}
                          title="Click to set phone"
                          className="text-xs text-gray-400 italic hover:text-blue-600 cursor-pointer"
                        >
                          + Add phone
                        </button>
                      )}
                    </td>

                    {/* 4. Rank (editable) */}
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {assoc.rank}
                      </span>
                    </td>

                    {/* 5. Referred By (editable) */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assoc.referredBy ? (
                        <button
                          type="button"
                          onClick={() => setEditingAssociate(assoc)}
                          title="Click to change sponsor"
                          className="text-left hover:text-blue-600 cursor-pointer"
                        >
                          <span className="font-medium text-gray-800">{assoc.referredBy.name}</span>
                          <span className="text-xs text-blue-600 ml-1">({assoc.referredBy.memberId})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingAssociate(assoc)}
                          title="Click to assign sponsor"
                          className="text-xs font-medium text-gray-400 italic hover:text-blue-600 cursor-pointer"
                        >
                          Direct / Head Office
                        </button>
                      )}
                    </td>

                    {/* 6. Downline (editable) */}
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setEditingAssociate(assoc)}
                        title="Click to edit downline count"
                        className="cursor-pointer hover:opacity-80"
                      >
                        {assoc.customDownline !== null && assoc.customDownline !== undefined ? (
                          <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-xs">
                            <Sparkles size={11} className="text-purple-500" />
                            <span>{assoc.customDownline}</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-700">
                            {assoc._count?.referrals || 0}
                          </span>
                        )}
                      </button>
                    </td>

                    {/* 7. Sales (editable) */}
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setEditingAssociate(assoc)}
                        title="Click to edit sales (GAJ)"
                        className="cursor-pointer hover:opacity-80"
                      >
                        {assoc.customSalesGaj !== null && assoc.customSalesGaj !== undefined ? (
                          <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs">
                            <Sparkles size={11} className="text-red-500" />
                            <span>{assoc.customSalesGaj} GAJ</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-700">
                            {assoc._count?.sales || 0} plots
                          </span>
                        )}
                      </button>
                    </td>

                    {/* 8. Wallet (editable) */}
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setEditingAssociate(assoc)}
                        title="Click to edit wallet balance"
                        className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                      >
                        ₹{(assoc.walletBalance || 0).toLocaleString("en-IN")}
                      </button>
                    </td>

                    {/* 9. Status (editable) */}
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleAssociateUpdated(assoc.id, { isActive: !assoc.isActive })}
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        <StatusBadge status={assoc.isActive ? "ACTIVE" : "INACTIVE"} />
                      </button>
                    </td>

                    {/* 10. Actions (Edit button, quick rank, activate/deactivate, delete) */}
                    <td className="px-4 py-3 text-sm">
                      <AssociateRowActions
                        id={assoc.id}
                        name={assoc.name}
                        memberId={assoc.memberId}
                        isActive={assoc.isActive}
                        currentRank={assoc.rank}
                        onEdit={() => setEditingAssociate(assoc)}
                        onDeleted={() => handleAssociateDeleted(assoc.id, assoc.memberId)}
                        onUpdated={(updates) => handleAssociateUpdated(assoc.id, updates)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Associate Modal */}
      {editingAssociate && (
        <EditAssociateModal
          associate={editingAssociate}
          sponsors={sponsorOptions}
          isOpen={editingAssociate !== null}
          onClose={() => setEditingAssociate(null)}
          onSuccess={(updated) => {
            handleAssociateUpdated(updated.id, updated);
            setEditingAssociate(null);
          }}
        />
      )}
    </div>
  );
}
