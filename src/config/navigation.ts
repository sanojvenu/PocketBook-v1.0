import { LayoutDashboard, Wallet, Bell, HelpCircle, Settings } from "lucide-react";

export const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Cashbook", href: "/cashbook", icon: Wallet },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Connect", href: "/connect", icon: HelpCircle },
    { name: "Admin", href: "/admin", icon: Settings },
];
