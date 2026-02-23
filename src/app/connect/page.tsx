"use client";

import { useState } from "react";
import { Send, Mail, User, HelpCircle, Heart, Zap, Bug, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const categories = [
    { id: "technical_issue", label: "Report a Technical Issue", icon: Bug },
    { id: "feedback", label: "General Feedback", icon: MessageSquare },
    { id: "idea", label: "Suggest an Idea", icon: Zap },
    { id: "join_team", label: "Join the Team", icon: User },
    { id: "support", label: "Support our Work (Donations)", icon: Heart },
    { id: "other", label: "Other", icon: HelpCircle },
];

export default function ConnectPage() {
    const { user } = useAuth();
    const [category, setCategory] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category) {
            toast.error("Please select a category");
            return;
        }
        if (!message.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setLoading(true);

        try {
            const selectedCategory = categories.find(c => c.id === category)?.label || "Inquiry";
            const subject = `[PocketBook Feedback] - ${selectedCategory}`;

            const deviceInfo = `
--------------------------------
Device Info:
User: ${user?.displayName || "Anonymous"} (${user?.email || "No Email"})
User Agent: ${navigator.userAgent}
Platform: ${navigator.platform}
Language: ${navigator.language}
--------------------------------`;

            const body = `${message}\n\n${deviceInfo}`;

            const mailtoLink = `mailto:mail@mypocketbook.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            window.location.href = mailtoLink;

            toast.success("Opening your email client...");
            setMessage("");
            setCategory("");
        } catch (error) {
            console.error("Error launching email:", error);
            toast.error("Failed to open email client. Please manually email mail@mypocketbook.in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0 md:pl-64 transition-all duration-300">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl mb-4">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Connect with Us
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                        We'd love to hear from you! whether you have a question, feedback, or just want to say hello.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="grid md:grid-cols-5 h-full">

                        {/* Visual Side Panel (Desktop) */}
                        <div className="hidden md:block col-span-2 bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 0 L100 100 L0 100 Z" fill="white" />
                                </svg>
                            </div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Why Reach Out?</h3>
                                    <ul className="space-y-4 text-blue-100">
                                        <li className="flex items-center gap-2">
                                            <Bug size={18} /> Report bugs to help us improve.
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Zap size={18} /> Suggest features you need.
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Heart size={18} /> Support our mission.
                                        </li>
                                    </ul>
                                </div>

                                <div className="mt-8">
                                    <p className="text-sm text-blue-200">Or email us directly at:</p>
                                    <a href="mailto:mail@mypocketbook.in" className="font-semibold hover:text-white transition-colors">
                                        mail@mypocketbook.in
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="col-span-3 p-6 md:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        I want to...
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categories.map((cat) => {
                                            const Icon = cat.icon;
                                            const isSelected = category === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCategory(cat.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${isSelected
                                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                                                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                        }`}
                                                >
                                                    <Icon size={18} className={isSelected ? "text-blue-500" : "text-gray-400"} />
                                                    <span className="text-sm font-medium">{cat.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Your Message
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Tell us more about it..."
                                        className="w-full h-40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Send size={20} />
                                    Send Message
                                </button>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
