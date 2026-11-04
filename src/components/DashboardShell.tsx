"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardShell({
  userRole,
  children,
}: {
  userRole: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex flex-col">
      <Header
        userRole={userRole}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-1 pt-[60px]">
        <Sidebar
          userRole={userRole}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-64 p-3 md:p-5 lg:p-6 overflow-x-hidden min-h-[calc(100vh-60px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
