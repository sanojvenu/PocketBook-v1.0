"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProfileModal from "../ProfileModal";
import UserAvatar from "../ui/UserAvatar";
import ConnectModal from "../modals/ConnectModal";
import { navItems } from "@/config/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const { user, role, logout } = useAuth();

  return (
    <>
      {/* Sidebar Container: Hidden on mobile, fixed on desktop left */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r-0 rounded-r-2xl my-4 ml-4"
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-center mb-6 px-2 perspective-1000">
            <img
              src="/logo-updated.png"
              alt="PocketBook Logo"
              className="w-32 h-auto object-contain drop-shadow-2xl hover:scale-110 hover:-translate-y-2 transition-all duration-300 ease-out transform-gpu"
              style={{ filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.3))' }}
            />
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              // RBAC Check: Hide Admin if not admin
              if (item.name === "Admin" && role !== "admin") return null;

              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.name === "Connect") {
                return (
                  <button
                    key={item.name}
                    onClick={() => setIsConnectModalOpen(true)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group hover:bg-white/50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300`}
                  >
                    <Icon size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-primary" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                      ${isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                      : "hover:bg-white/50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                    }
                    `}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-primary"} />
                  <span className={`font-medium text-sm ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2">
            {/* Ask AI Button */}
            <button
              onClick={() => window.dispatchEvent(new Event('open-chat'))}
              className="mx-3 mb-2 p-2 flex items-center gap-3 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all group"
            >
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Sparkles size={18} />
              </div>
              <span className="font-medium text-sm">Ask <span className="text-[#073449]">Pocket</span><span className="text-[#F07E23]">Book</span></span>
            </button>

            <div className="p-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={logout}
                className="flex items-center gap-3 text-gray-500 hover:text-red-500 transition-colors w-full px-2"
              >
                <LogOut size={18} />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-3 px-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1.5 rounded-xl transition-colors group"
              >
                <div className="shrink-0">
                  <UserAvatar name={user?.displayName} size={36} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate group-hover:text-blue-600 transition-colors">{user?.displayName || "User"}</p>
                  {role !== 'user' && (
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {role || "Loading..."}
                    </p>
                  )}
                </div>
              </button>
            </div>

            <div className="pt-4 pb-2 text-center">
              <p className="text-[10px] text-gray-400 font-medium">
                Built with <span className="text-red-500 animate-pulse">❤️</span> in India
              </p>
            </div>
          </div>
        </div>
      </aside>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </>
  );
}
