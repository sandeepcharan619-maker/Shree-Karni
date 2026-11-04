"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, Check, User as UserIcon } from "lucide-react";

interface AssociatePhotoUploaderProps {
  initialAvatar?: string | null;
  userName: string;
  rank: string;
}

export default function AssociatePhotoUploader({
  initialAvatar,
  userName,
  rank,
}: AssociatePhotoUploaderProps) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar || null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAvatar) {
      setAvatar(initialAvatar);
    }
  }, [initialAvatar]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB");
      return;
    }

    setUploading(true);
    setSuccess(false);

    try {
      // 1. Read and compress image to data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

            // 2. Save to database via PUT /api/profile
            const res = await fetch("/api/profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avatarUrl: compressedDataUrl }),
            });

            if (!res.ok) {
              throw new Error("Failed to upload profile photo");
            }

            setAvatar(compressedDataUrl);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

            // Broadcast to Header and Sidebar
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("skr-profile-updated", {
                  detail: { avatarUrl: compressedDataUrl },
                })
              );
            }
          }
          setUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Photo upload error:", err);
      alert(err.message || "Failed to upload photo");
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        {/* Avatar circle */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-100 border-3 border-amber-400 shadow-md flex items-center justify-center relative">
          {avatar ? (
            <img src={avatar} alt={userName} className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-800 font-bold text-2xl">
              {userName?.charAt(0)?.toUpperCase() || "A"}
            </div>
          )}

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
              <Loader2 size={24} className="animate-spin text-amber-400" />
            </div>
          )}

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold">
            <Camera size={18} className="mb-0.5" />
            <span>Change</span>
          </div>
        </div>

        {/* Small Camera Button Badge */}
        <button
          type="button"
          title="Upload / Change Profile Photo"
          aria-label="Upload / Change Profile Photo"
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md border-2 border-white transition group-hover:scale-110 cursor-pointer"
        >
          {success ? <Check size={14} className="text-white" /> : <Camera size={13} />}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Rank Ribbon Badge below photo matching reference */}
      <div className="mt-2 text-center">
        <div className="inline-block bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded shadow-sm">
          {rank || "Gold Associate"}
        </div>
      </div>
    </div>
  );
}
