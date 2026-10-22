"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-[#e9b04c] text-white h-[52px] flex items-center px-4 lg:px-6 fixed top-0 left-0 right-0 z-30 shadow-sm select-none">
      <div className="flex items-center gap-4">
        {/* Brand Name / Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Shree Karni Real Estate"
            width={170}
            height={36}
            className="h-8 w-auto brightness-200 contrast-200"
            priority
          />
        </Link>

        {/* Hamburger button */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
          className="p-1 hover:bg-[#d89f3a] rounded transition text-white"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
