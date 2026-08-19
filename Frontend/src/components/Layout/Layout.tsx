import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import CommandPalette from "../CommandPalette";
import { cn } from "../../lib/utils";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });

  const location = useLocation();
  const isCaixaPOS =
    location.pathname === "/caixa" ||
    location.pathname === "/pos" ||
    location.pathname.startsWith("/caixa") ||
    location.pathname.startsWith("/pos");

  return (
    <div className="h-screen w-screen flex bg-background dark:bg-background-dark overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 h-screen overflow-hidden",
          isSidebarOpen ? "md:ml-64" : "md:ml-20 ml-0"
        )}
      >
        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main
          className={cn(
            "flex-1 relative flex flex-col min-h-0 min-w-0",
            isCaixaPOS ? "p-0 overflow-hidden" : "p-4 lg:p-8 overflow-y-auto"
          )}
        >
          <Outlet />
          <CommandPalette />
        </main>
      </div>
    </div>
  );
}
