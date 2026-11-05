"use client";

import { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  Check,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  User,
  Sparkles,
} from "lucide-react";

export interface KycAssociateData {
  id: string;
  name: string;
  memberId: string;
  phone?: string | null;
  email?: string | null;
  rank?: string;
  createdAt?: string | Date;
  avatarUrl?: string | null;
  aadhaarDocUrl?: string | null;
  panDocUrl?: string | null;
  photoDocUrl?: string | null;
  addressDocUrl?: string | null;
  bankDocUrl?: string | null;
  aadhaarStatus?: string | null;
  panStatus?: string | null;
  photoStatus?: string | null;
  addressStatus?: string | null;
  bankDocStatus?: string | null;
  kycStatus?: string | null;
  kycRejectReason?: string | null;
}

interface AdminKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  associate: KycAssociateData;
  onUpdated: (updatedAssociate: KycAssociateData) => void;
}

export default function AdminKycModal({
  isOpen,
  onClose,
  associate: initialAssociate,
  onUpdated,
}: AdminKycModalProps) {
  const [associate, setAssociate] = useState<KycAssociateData>(initialAssociate);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // On demand fetch documents for this associate if not already populated
  useEffect(() => {
    setAssociate(initialAssociate);
    if (
      initialAssociate?.id &&
      !initialAssociate.aadhaarDocUrl &&
      !initialAssociate.panDocUrl &&
      !initialAssociate.photoDocUrl &&
      !initialAssociate.addressDocUrl &&
      !initialAssociate.bankDocUrl
    ) {
      setFetchingDocs(true);
      fetch(`/api/admin/associates/kyc?associateId=${initialAssociate.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.associate) {
            setAssociate((prev) => ({ ...prev, ...data.associate }));
          }
        })
        .catch(() => {})
        .finally(() => setFetchingDocs(false));
    }
  }, [initialAssociate?.id]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateStatus = async (
    docType: "aadhaar" | "pan" | "photo" | "address" | "bank" | "all",
    action: "APPROVE" | "REJECT",
    reason?: string
  ) => {
    setLoadingDoc(docType);
    try {
      const res = await fetch("/api/admin/associates/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associateId: associate.id,
          docType,
          action,
          reason: reason || rejectReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update KYC status");
      }

      setAssociate(data.associate);
      onUpdated(data.associate);
      showToast(
        docType === "all"
          ? `All KYC documents ${action.toLowerCase()}d successfully!`
          : `${docType.toUpperCase()} document ${action.toLowerCase()}d!`
      );
      setRejectingDoc(null);
      setRejectReason("");
    } catch (err: any) {
      showToast(err.message || "Failed to update status");
    } finally {
      setLoadingDoc(null);
    }
  };

  const documents = [
    {
      type: "aadhaar" as const,
      name: "Aadhaar Card (Front & Back)",
      desc: "12-digit UIDAI proof for identity & residential verification.",
      url: associate.aadhaarDocUrl,
      status: associate.aadhaarStatus || "PENDING",
    },
    {
      type: "pan" as const,
      name: "PAN Card",
      desc: "Mandatory tax document for legal compliance & commission TDS.",
      url: associate.panDocUrl,
      status: associate.panStatus || "PENDING",
    },
    {
      type: "photo" as const,
      name: "Passport Size Photograph",
      desc: "Official photo for associate corporate identity card.",
      url: associate.photoDocUrl || associate.avatarUrl,
      status: associate.photoStatus || "PENDING",
    },
    {
      type: "address" as const,
      name: "Address Proof",
      desc: "Voter ID, Electricity bill or Domicile certificate.",
      url: associate.addressDocUrl,
      status: associate.addressStatus || "PENDING",
    },
    {
      type: "bank" as const,
      name: "Bank Proof (Cheque / Passbook)",
      desc: "Account & IFSC verification proof for commission payouts.",
      url: associate.bankDocUrl,
      status: associate.bankDocStatus || "PENDING",
    },
  ];

  const allApproved =
    associate.kycStatus === "APPROVED" ||
    documents.every((d) => d.status === "APPROVED");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0d1b2a] text-white p-5 flex items-center justify-between sticky top-0 z-10 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-md">
              {associate.name ? associate.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{associate.name}</h3>
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded">
                  {associate.memberId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {associate.phone || "No phone"} • {associate.rank || "Client Adviser"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center">
            {toastMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              allApproved
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : associate.kycStatus === "REJECTED"
                ? "bg-red-50 border-red-200 text-red-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center gap-3">
              {allApproved ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
              ) : associate.kycStatus === "REJECTED" ? (
                <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                  <XCircle size={20} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {allApproved
                    ? "KYC Status: Fully Approved & Verified"
                    : associate.kycStatus === "REJECTED"
                    ? "KYC Status: Rejected"
                    : "KYC Status: Pending Verification"}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {allApproved
                    ? "Associate is legally verified to sell plots and receive commission payouts."
                    : associate.kycStatus === "REJECTED"
                    ? associate.kycRejectReason || "Documents need to be re-uploaded by associate."
                    : "Review the 5 mandatory documents below and approve or reject."}
                </p>
              </div>
            </div>

            {/* Quick Action: Approve All */}
            {!allApproved && (
              <button
                disabled={loadingDoc === "all"}
                onClick={() => handleUpdateStatus("all", "APPROVE")}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Check size={14} />
                <span>{loadingDoc === "all" ? "Approving..." : "Approve All Documents"}</span>
              </button>
            )}
          </div>

          {/* Documents Grid */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Submitted Verification Documents (5)
            </h4>

            {documents.map((doc) => {
              const isApproved = doc.status === "APPROVED";
              const isRejected = doc.status === "REJECTED";
              const hasUrl = Boolean(doc.url);
              const isLoading = loadingDoc === doc.type;
              const isRejectingThis = rejectingDoc === doc.type;

              return (
                <div
                  key={doc.type}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-gray-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-700"
                            : isRejected
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-gray-900">{doc.name}</h5>
                          {/* Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800"
                                : isRejected
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 size={11} />
                            ) : isRejected ? (
                              <XCircle size={11} />
                            ) : (
                              <Clock size={11} />
                            )}
                            <span>{isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                        <div className="text-[11px] font-mono mt-1 text-gray-400">
                          {hasUrl ? (
                            <span className="text-blue-600 font-semibold">
                              ✓ Document uploaded by associate
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium">
                              ⚠ Not uploaded yet by associate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {hasUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ title: doc.name, url: doc.url! })}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View Doc</span>
                        </button>
                      )}

                      {!isApproved ? (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleUpdateStatus(doc.type, "APPROVE")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          <Check size={13} />
                          <span>{isLoading ? "Saving..." : "Approve"}</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          ✓ Verified
                        </span>
                      )}

                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => setRejectingDoc(doc.type)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold transition cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Rejection Reason Prompt */}
                  {isRejectingThis && (
                    <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg space-y-2">
                      <p className="text-xs font-bold text-red-900">
                        Specify rejection reason for {doc.name}:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Blurry photo, mismatched name, expired document..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="flex-1 bg-white border border-red-300 rounded-lg px-3 py-1.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleUpdateStatus(doc.type, "REJECT")}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Confirm Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingDoc(null);
                            setRejectReason("");
                          }}
                          className="px-2.5 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Approved status is instantly reflected on the associate dashboard and profile.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Document Lightbox Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-[#0d1b2a] text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">{previewDoc.title}</h4>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-gray-100 min-h-[300px]">
              {previewDoc.url.startsWith("data:image/") ||
              previewDoc.url.match(/\.(jpeg|jpg|png|webp|gif)/i) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow"
                />
              ) : (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                  className="w-full h-[65vh] border-0 rounded-lg"
                />
              )}
            </div>
            <div className="p-3 bg-white border-t flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
