"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  UserPlus,
  Search,
  PlusCircle,
  X,
  Phone,
  Mail,
  Calendar,
  Users,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export interface AssociateNode {
  id: string;
  name: string;
  username?: string;
  memberId: string;
  phone?: string | null;
  email?: string | null;
  rank?: string;
  isActive?: boolean;
  createdAt?: string | Date;
  referredById?: string | null;
  referredBy?: { id?: string; name: string; memberId: string } | null;
}

interface TreeNode extends AssociateNode {
  level: number;
  children: TreeNode[];
}

const STORAGE_KEY = "shreekarni_custom_associates_v1";

// Yellow Folder SVG component matching classic directory folder icon
function ManillaFolderIcon() {
  return (
    <span className="inline-block relative w-4 h-3.5 shrink-0 -mt-0.5">
      <svg
        viewBox="0 0 24 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xs"
      >
        <path
          d="M1.5 3C1.5 2.17157 2.17157 1.5 3 1.5H8.5C9.03043 1.5 9.53914 1.71071 9.91421 2.08579L11.8284 4H21C21.8284 4 22.5 4.67157 22.5 5.5V17C22.5 17.8284 21.8284 18.5 21 18.5H3C2.17157 18.5 1.5 17.8284 1.5 17V3Z"
          fill="#E8B84B"
        />
        <path
          d="M1.5 6.5C1.5 5.67157 2.17157 5 3 5H21C21.8284 5 22.5 5.67157 22.5 6.5V17C22.5 17.8284 21.8284 18.5 21 18.5H3C2.17157 18.5 1.5 17.8284 1.5 17V6.5Z"
          fill="#F5CD63"
        />
      </svg>
    </span>
  );
}

export default function AssociateTreeView({
  currentUser,
  initialDownlines = [],
}: {
  currentUser: AssociateNode;
  initialDownlines: AssociateNode[];
}) {
  const [allDownlines, setAllDownlines] = useState<AssociateNode[]>(initialDownlines);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    [currentUser.id]: true,
  });
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State for adding associate directly under tree
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [parentTarget, setParentTarget] = useState<AssociateNode>(currentUser);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [addForm, setAddForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    rank: "Client Adviser",
  });

  // Sync with localStorage so newly registered associates appear instantly
  useEffect(() => {
    const syncLocal = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const localList: AssociateNode[] = JSON.parse(stored);
          if (Array.isArray(localList) && localList.length > 0) {
            setAllDownlines((prev) => {
              const map = new Map<string, AssociateNode>();
              prev.forEach((item) =>
                map.set((item.memberId || item.id).toUpperCase(), item)
              );
              localList.forEach((item) => {
                const key = (item.memberId || item.id).toUpperCase();
                map.set(key, item);
              });
              return Array.from(map.values());
            });
          }
        }
      } catch (e) {
        console.warn("Tree local sync error:", e);
      }
    };

    syncLocal();
    window.addEventListener("skr-associate-added", syncLocal);
    return () => window.removeEventListener("skr-associate-added", syncLocal);
  }, []);

  // Recursively build hierarchical tree
  const treeData = useMemo<TreeNode>(() => {
    const rootId = currentUser.id;
    const rootMemberId = (currentUser.memberId || "").toUpperCase();

    const isChildOf = (child: AssociateNode, parentId: string, parentMemberId: string) => {
      if (child.id === parentId) return false;
      if (child.referredById === parentId) return true;
      if (child.referredBy?.id === parentId) return true;
      if (
        parentMemberId &&
        child.referredBy?.memberId &&
        child.referredBy.memberId.toUpperCase() === parentMemberId
      ) {
        return true;
      }
      return false;
    };

    const buildChildren = (parentId: string, parentMemberId: string, level: number): TreeNode[] => {
      const directChildren: AssociateNode[] = [];
      const seen = new Set<string>();

      allDownlines.forEach((item) => {
        const key = (item.memberId || item.id).toUpperCase();
        if (seen.has(key)) return;

        if (isChildOf(item, parentId, parentMemberId)) {
          seen.add(key);
          directChildren.push(item);
        }
      });

      return directChildren.map((child) => {
        const childNode: TreeNode = {
          ...child,
          level,
          children: buildChildren(child.id, (child.memberId || "").toUpperCase(), level + 1),
        };
        return childNode;
      });
    };

    const root: TreeNode = {
      ...currentUser,
      level: 1,
      children: buildChildren(rootId, rootMemberId, 2),
    };

    return root;
  }, [currentUser, allDownlines]);

  // Set default selected node to root
  useEffect(() => {
    if (!selectedNode) {
      setSelectedNode(treeData);
    }
  }, [treeData, selectedNode]);

  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = { [currentUser.id]: true };
    allDownlines.forEach((d) => {
      next[d.id] = true;
    });
    setExpandedNodes(next);
  };

  const collapseAll = () => {
    setExpandedNodes({ [currentUser.id]: true });
  };

  const countTotalDownline = (node: TreeNode): number => {
    let count = node.children.length;
    node.children.forEach((c) => {
      count += countTotalDownline(c);
    });
    return count;
  };

  // Open add associate modal targeting a specific parent node
  const openAddModal = (target: AssociateNode) => {
    setParentTarget(target);
    setModalError("");
    setAddForm({
      name: "",
      username: "",
      phone: "",
      email: "",
      password: "",
      rank: "Client Adviser",
    });
    setIsAddModalOpen(true);
  };

  // Submit adding associate under tree
  const handleAddAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    try {
      const res = await fetch("/api/associates/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          username: addForm.username.trim(),
          phone: addForm.phone.trim(),
          email: addForm.email?.trim() || null,
          password: addForm.password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register associate");
      }

      const assignedMemberId = data.memberId || `SKR${Math.floor(10000 + Math.random() * 90000)}`;
      const parent = parentTarget || currentUser;

      const newAssociateItem: AssociateNode = data.user || {
        id: `assoc-${Date.now()}`,
        name: addForm.name.trim(),
        username: addForm.username.trim(),
        memberId: assignedMemberId,
        phone: addForm.phone.trim(),
        email: addForm.email?.trim() || null,
        rank: addForm.rank || "Client Adviser",
        isActive: true,
        createdAt: new Date().toISOString(),
        referredById: parent.id,
        referredBy: {
          id: parent.id,
          name: parent.name,
          memberId: parent.memberId,
        },
      };

      // 1. Immediately update tree downlines state
      setAllDownlines((prev) => [newAssociateItem, ...prev]);

      // 2. Persist to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(newAssociateItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(
          new CustomEvent("skr-associate-added", { detail: newAssociateItem })
        );
      } catch (err) {
        console.warn("Storage write error:", err);
      }

      // 3. Expand parent node so child is instantly visible
      setExpandedNodes((prev) => ({
        ...prev,
        [parent.id]: true,
      }));

      setToast({
        type: "success",
        text: `Associate "${newAssociateItem.name}" registered successfully (ID: ${assignedMemberId}) and placed under ${parent.name}!`,
      });

      setIsAddModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || "Failed to add associate");
    } finally {
      setModalLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Render tree node recursively
  const renderNode = (node: TreeNode, isLast: boolean, prefix: string) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children.length > 0;
    const isSelected = selectedNode?.id === node.id || selectedNode?.memberId === node.memberId;
    const isMatch = search.trim()
      ? node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.memberId.toLowerCase().includes(search.toLowerCase())
      : true;

    // Node label format matching user's screenshot: {Name}_{MemberId}_{Level}
    const nodeLabel = `${node.name}_${node.memberId}_${node.level}`;

    return (
      <div key={node.id} className="relative select-none text-xs md:text-sm">
        <div className="flex items-center gap-1.5 py-1">
          {/* Tree branch connector lines */}
          <div className="flex items-center font-mono text-gray-400 select-none">
            {node.level > 1 && (
              <span className="inline-block w-4 text-center text-gray-400">
                {isLast ? "└" : "├"}
              </span>
            )}
            <span className="text-gray-300">──</span>

            {/* Expand / Collapse toggle box */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="w-3.5 h-3.5 border border-gray-400 bg-white text-gray-700 flex items-center justify-center text-[10px] leading-none rounded-2xs hover:bg-gray-100 transition shadow-2xs mr-1 cursor-pointer"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? "−" : "+"}
              </button>
            ) : (
              <span className="w-3.5 inline-block mr-1 text-center text-gray-300">
                ┄
              </span>
            )}
          </div>

          {/* Node Button with Light Blue Highlight exactly as screenshot */}
          <div
            onClick={() => {
              setSelectedNode(node);
              if (hasChildren && !isExpanded) toggleExpand(node.id);
            }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs transition cursor-pointer font-sans ${
              isSelected
                ? "bg-[#cce9f5] border border-[#a2d4ec] text-[#0f2d4a] shadow-xs"
                : isMatch
                ? "hover:bg-slate-100 border border-transparent text-gray-800"
                : "opacity-40 hover:opacity-80 border border-transparent text-gray-500"
            }`}
          >
            <ManillaFolderIcon />
            <span className="text-xs md:text-[13px] tracking-tight whitespace-nowrap font-medium">
              {nodeLabel}
            </span>
            {hasChildren && (
              <span className="text-[10px] text-gray-500 font-mono ml-0.5">
                ({node.children.length})
              </span>
            )}
          </div>
        </div>

        {/* Children Sub-tree */}
        {hasChildren && isExpanded && (
          <div className="pl-6 border-l border-dashed border-gray-300 ml-2">
            {node.children.map((child, idx) =>
              renderNode(child, idx === node.children.length - 1, prefix + (isLast ? "  " : "│ "))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium shadow-xs border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Associates List
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Interactive downline network hierarchy and associate tree view
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAddModal(selectedNode || currentUser)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <UserPlus size={14} />
              <span>+ Add Associate Under Tree</span>
            </button>

            <Link
              href="/dashboard/register"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition"
            >
              <span>Full Registration Form →</span>
            </Link>
          </div>
        </div>

        {/* Tree Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search associate name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition cursor-pointer"
            >
              Collapse All
            </button>
            <span className="text-xs text-gray-500 ml-2">
              Total Team: <strong>{countTotalDownline(treeData)}</strong>
            </span>
          </div>
        </div>

        {/* Main Content Area: Tree on Left, Details on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* Tree View Container */}
          <div className="lg:col-span-2 bg-[#fcfcfc] border border-gray-200 rounded-lg p-4 md:p-6 min-h-[360px] overflow-x-auto shadow-2xs font-mono">
            <div className="tree-container">
              {renderNode(treeData, true, "")}
            </div>

            {treeData.children.length === 0 && (
              <div className="mt-8 p-6 text-center rounded border border-dashed border-gray-300 bg-white">
                <p className="text-xs text-gray-500 mb-2">
                  You currently have no downline associates registered.
                </p>
                <button
                  type="button"
                  onClick={() => openAddModal(currentUser)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>Add First Associate Under Your Tree</span>
                </button>
              </div>
            )}
          </div>

          {/* Associate Details Sidebar Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Selected Associate
              </h3>
              {selectedNode && (
                <button
                  type="button"
                  onClick={() => openAddModal(selectedNode)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition cursor-pointer"
                >
                  + Add Under This
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0a1628] text-white flex items-center justify-center font-bold text-lg">
                    {selectedNode.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {selectedNode.name}
                    </h4>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#e9b04c]/20 text-[#96630e] border border-[#e9b04c]/40">
                      {selectedNode.memberId}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Tree Level</span>
                    <span className="font-bold text-blue-700">Level {selectedNode.level}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Direct Team</span>
                    <span className="font-semibold text-gray-800">{selectedNode.children.length} Members</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Total Downline</span>
                    <span className="font-semibold text-gray-800">{countTotalDownline(selectedNode)} Members</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Rank</span>
                    <span className="font-semibold text-emerald-700">{selectedNode.rank || "Client Adviser"}</span>
                  </div>

                  {selectedNode.phone && (
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-semibold text-gray-800">{selectedNode.phone}</span>
                    </div>
                  )}

                  {selectedNode.email && (
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span className="text-gray-500">Email</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[150px]">{selectedNode.email}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>
                </div>

                {/* Quick Add Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => openAddModal(selectedNode)}
                    className="w-full py-2 bg-[#0a1628] hover:bg-[#12243e] text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus size={14} className="text-[#e9b04c]" />
                    <span>Add New Associate Under {selectedNode.name.split(" ")[0]}</span>
                  </button>
                </div>

                {selectedNode.children.length > 0 && (
                  <div className="pt-2">
                    <h5 className="text-[11px] font-bold text-gray-700 mb-1.5">
                      Direct Associates ({selectedNode.children.length}):
                    </h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedNode.children.map((child) => (
                        <div
                          key={child.id}
                          onClick={() => setSelectedNode(child)}
                          className="px-2 py-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded text-[11px] text-gray-700 flex items-center justify-between cursor-pointer transition"
                        >
                          <span className="font-medium truncate">{child.name}</span>
                          <span className="text-gray-500 text-[10px] font-mono">{child.memberId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Click any associate in the tree to view full details.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Associate Under Tree */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-[#e9b04c]" />
                <h3 className="font-bold text-gray-900 text-base">
                  Add Associate Under Tree
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Parent Sponsor Notice */}
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div>
                <span className="text-emerald-700 font-medium">Placement Sponsor:</span>{" "}
                <strong>{parentTarget.name}</strong> ({parentTarget.memberId})
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                Parent Node
              </span>
            </div>

            {modalError && (
              <div className="mb-4 px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddAssociate} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh.sharma"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9829012345"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@example.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rank Tier
                  </label>
                  <select
                    value={addForm.rank}
                    onChange={(e) => setAddForm({ ...addForm, rank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Client Adviser">Client Adviser</option>
                    <option value="Senior Adviser">Senior Adviser</option>
                    <option value="Bronze Adviser">Bronze Adviser</option>
                    <option value="Silver Adviser">Silver Adviser</option>
                    <option value="Gold Adviser">Gold Adviser</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {modalLoading ? "Registering & Adding..." : "Register & Add to Tree"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
