"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  MapPin,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  FileText,
  X,
  Search,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  location: string;
  description: string | null;
  status: string;
  totalAcreage: number | null;
  totalPlotsCount: number | null;
  imageUrl: string | null;
  layoutMapUrl: string | null;
  plotsCount: number;
  availablePlots: number;
  bookedPlots: number;
  soldPlots: number;
  totalInventoryValue: number;
  soldSalesValue: number;
}

interface AdminProjectsManagerProps {
  initialProjects: Project[];
}

export default function AdminProjectsManager({ initialProjects }: AdminProjectsManagerProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    location: "Vatika, Tonk Road, Jaipur, Rajasthan",
    description: "",
    status: "ACTIVE",
    totalAcreage: "25",
    totalPlotsCount: "120",
    imageUrl: "/website-bg.png",
    layoutMapUrl: "",
  });

  const openAddModal = () => {
    setEditingProject(null);
    setForm({
      name: "",
      location: "Vatika, Tonk Road, Jaipur, Rajasthan",
      description: "",
      status: "ACTIVE",
      totalAcreage: "25",
      totalPlotsCount: "120",
      imageUrl: "/website-bg.png",
      layoutMapUrl: "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setForm({
      name: proj.name,
      location: proj.location,
      description: proj.description || "",
      status: proj.status,
      totalAcreage: proj.totalAcreage?.toString() || "25",
      totalPlotsCount: (proj.totalPlotsCount ?? proj.plotsCount ?? 120).toString(),
      imageUrl: proj.imageUrl || "/website-bg.png",
      layoutMapUrl: proj.layoutMapUrl || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "/api/admin/projects";
      const method = editingProject ? "PUT" : "POST";
      const payload = editingProject ? { ...form, id: editingProject.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save project");

      // Refresh project list with cache-busting
      const fetchRes = await fetch(`/api/admin/projects?_t=${Date.now()}`);
      const fetchData = await fetchRes.json();
      if (fetchData.projects) {
        setProjects(fetchData.projects);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");

      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Vatika, Jaipur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Add and manage residential townships, layout plans, and inventory in Vatika & Tonk Road corridor.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs sm:text-sm shadow-sm transition hover:shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "ACTIVE", "UPCOMING", "COMPLETED"].map((st) => (
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between"
          >
            {/* Project Image Banner */}
            <div className="relative h-44 w-full bg-slate-800 overflow-hidden group">
              <img
                src={proj.imageUrl || "/website-bg.png"}
                alt={proj.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/40 to-transparent" />

              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    proj.status === "ACTIVE"
                      ? "bg-emerald-500 text-white"
                      : proj.status === "UPCOMING"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-500 text-white"
                  }`}
                >
                  {proj.status}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-base font-bold text-white drop-shadow-md leading-tight">
                  {proj.name}
                </h3>
                <p className="text-xs text-amber-300 font-medium flex items-center gap-1 mt-0.5 drop-shadow">
                  <MapPin size={12} />
                  {proj.location}
                </p>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-slate-600 line-clamp-2">
                {proj.description || "Premium residential gated township with complete civic infrastructure."}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Acreage</span>
                  <span className="font-bold text-slate-800">{proj.totalAcreage || 20} Acres</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Plots</span>
                  <span className="font-bold text-slate-800">{proj.totalPlotsCount || proj.plotsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Available</span>
                  <span className="font-bold text-emerald-700">{proj.availablePlots}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Sold / Booked Progress</span>
                  <span>
                    {(proj.totalPlotsCount || proj.plotsCount) > 0
                      ? Math.round(((proj.soldPlots + proj.bookedPlots) / (proj.totalPlotsCount || proj.plotsCount)) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${(proj.totalPlotsCount || proj.plotsCount) > 0 ? (proj.soldPlots / (proj.totalPlotsCount || proj.plotsCount)) * 100 : 0}%`,
                    }}
                    className="bg-rose-500 h-full"
                    title={`Sold: ${proj.soldPlots}`}
                  />
                  <div
                    style={{
                      width: `${(proj.totalPlotsCount || proj.plotsCount) > 0 ? (proj.bookedPlots / (proj.totalPlotsCount || proj.plotsCount)) * 100 : 0}%`,
                    }}
                    className="bg-amber-500 h-full"
                    title={`Booked: ${proj.bookedPlots}`}
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/admin/plots?projectId=${proj.id}`}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition"
                >
                  <span>View Inventory ({proj.plotsCount})</span>
                  <ExternalLink size={12} />
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(proj)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Edit project"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id, proj.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              {editingProject ? "Edit Project" : "Add New Township Project"}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter township details located in Vatika, Jaipur region.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shree Karni Vatika Township"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Acreage</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.totalAcreage}
                    onChange={(e) => setForm({ ...form, totalAcreage: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Plots Count</label>
                  <input
                    type="number"
                    value={form.totalPlotsCount}
                    onChange={(e) => setForm({ ...form, totalPlotsCount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Gated residential community with JDA approval, 60ft wide avenues..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/website-bg.png"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
