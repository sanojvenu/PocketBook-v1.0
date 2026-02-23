"use client";

import { useState } from "react";
import { X, Send, Bug, MessageSquare, Zap, User, Heart, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const categories = [
    { id: "technical_issue", label: "Report a Bug", icon: Bug },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "idea", label: "Suggest Idea", icon: Zap },
    { id: "join_team", label: "Join Team", icon: User },
    { id: "support", label: "Donate", icon: Heart },
    { id: "other", label: "Other", icon: HelpCircle },
];

export default function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
    const { user } = useAuth();
    const [category, setCategory] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

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
            onClose();
        } catch (error) {
            console.error("Error launching email:", error);
            toast.error("Failed to open email client.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold">Connect with Us</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-500">I want to...</label>
                        <div className="grid grid-cols-2 gap-2">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategory(cat.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-xs font-medium ${isSelected
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <Icon size={14} className={isSelected ? "text-blue-500" : "text-gray-400"} />
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-gray-500">Your Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell us what's on your mind..."
                            className="w-full h-32 p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            Send Message
                        </button>

                        <p className="text-xs text-center text-gray-400">
                            or email us at <a href="mailto:mail@mypocketbook.in" className="text-blue-500 hover:underline">mail@mypocketbook.in</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
