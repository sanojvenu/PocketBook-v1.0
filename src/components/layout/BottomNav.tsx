"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, X, Smartphone, Wallet, BarChart3, HelpCircle, Menu, LogOut, Sparkles, User, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ProfileModal from "../ProfileModal";
import UserAvatar from "../ui/UserAvatar";
import ConnectModal from "../modals/ConnectModal";
import { navItems } from "@/config/navigation";

export default function BottomNav() {
    const pathname = usePathname();
    const { user, role, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

    // Filter main items (first 3)
    const mainItems = navItems.slice(0, 3);

    // Filter secondary items (Connect) and Admin if applicable
    const secondaryItems = navItems.filter(item =>
        item.name === "Connect" || (item.name === "Admin" && role === 'admin')
    );




    // Listen for 'close-menu' event from AppInitializer (for Android Back Button)
    useEffect(() => {
        const handleCloseMenu = () => {
            setIsMenuOpen(false);
            (window as any).isPbookMenuOpen = false;
        };

        window.addEventListener('close-menu', handleCloseMenu);
        return () => window.removeEventListener('close-menu', handleCloseMenu);
    }, []);

    // Sync global flag with React state
    useEffect(() => {
        (window as any).isPbookMenuOpen = isMenuOpen;
        return () => {
            (window as any).isPbookMenuOpen = false;
        };
    }, [isMenuOpen]);

    return (
        <>
            {/* Bottom Docked Nav - v3 */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around z-50 md:hidden px-2 pb-safe">
                {mainItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{ backgroundColor: isActive ? '#073449' : 'transparent' }}
                            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl transition-all duration-300 ${isActive ? 'text-white shadow-lg shadow-[#073449]/20 translate-y-[-4px]' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                        </Link>
                    )
                })}

                {/* Ask AI - Inline aligned */}
                <button
                    onClick={() => window.dispatchEvent(new Event('open-chat'))}
                    className="flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all group"
                >
                    <div className="p-1 rounded-full group-hover:scale-110 transition-transform">
                        <Sparkles size={24} className="text-[#073449] fill-[#073449]/10" />
                    </div>
                    <span className="text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#073449] to-[#0a4a66]">Ask AI</span>
                </button>

                <button
                    onClick={() => {
                        setIsMenuOpen(true);
                        (window as any).isPbookMenuOpen = true;
                    }}
                    style={{ backgroundColor: isMenuOpen ? '#073449' : 'transparent' }}
                    className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-2xl transition-all duration-300 ${isMenuOpen ? 'text-white shadow-lg shadow-[#073449]/20 translate-y-[-4px]' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}
                >
                    <Menu size={20} strokeWidth={isMenuOpen ? 2.5 : 2} />
                    <span className={`text-[10px] ${isMenuOpen ? 'font-bold' : 'font-medium'}`}>Menu</span>
                </button>
            </div>

            {/* Expanded Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden flex flex-col justify-end">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => {
                            setIsMenuOpen(false);
                            (window as any).isPbookMenuOpen = false;
                        }}
                    />

                    <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">Menu</h3>
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    (window as any).isPbookMenuOpen = false;
                                }}
                                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Profile Card */}
                        <div
                            onClick={() => {
                                setIsProfileModalOpen(true);
                                setIsMenuOpen(false);
                            }}
                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <div className="shrink-0">
                                <UserAvatar name={user?.displayName} size={48} />
                            </div>
                            <div>
                                <h4 className="font-bold text-base">{user?.displayName || "User"}</h4>
                                <p className="text-xs text-gray-500 capitalize">{role}</p>
                            </div>
                        </div>

                        {/* Secondary Links */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new Event('open-import'));
                                    setIsMenuOpen(false);
                                    (window as any).isPbookMenuOpen = false;
                                }}
                                className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                                <Upload size={24} />
                                <span className="font-medium text-sm">Import</span>
                            </button>
                            {secondaryItems.map((item) => {
                                const Icon = item.icon;
                                if (item.name === "Connect") {
                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => {
                                                setIsConnectModalOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <Icon size={24} />
                                            <span className="font-medium text-sm">{item.name}</span>
                                        </button>
                                    );
                                }
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    >
                                        <Icon size={24} />
                                        <span className="font-medium text-sm">{item.name}</span>
                                    </Link>
                                );
                            })}
                            <Link
                                key="/faq"
                                href="/faq"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                                <HelpCircle size={24} />
                                <span className="font-medium text-sm">FAQ</span>
                            </Link>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={() => {
                                logout();
                                setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-2xl transition-colors"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

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
