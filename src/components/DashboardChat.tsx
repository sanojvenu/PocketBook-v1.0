"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Maximize2, Minimize2, RefreshCw, X, Bot } from "lucide-react";
import { useChatLogic } from "@/hooks/useChatLogic";
import { useBudgets } from "@/hooks/useBudgets";
import { useAuth } from "@/context/AuthContext";
import { getSmartSuggestions } from "@/lib/insightsEngine";
import { ChatInput } from "./chat/ChatInput";
import { MessageList } from "./chat/MessageList";
import { Transaction, Reminder } from "@/types";

interface DashboardChatProps {
    transactions: Transaction[];
    reminders: Reminder[];
    onTransaction: (data: any) => Promise<void>;
    onReminder: (data: any) => Promise<void>;
}

export default function DashboardChat({ transactions, reminders, onTransaction, onReminder }: DashboardChatProps) {
    const { user } = useAuth();
    const { budgets, saveBudget } = useBudgets();

    // UI State
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // AI Logic Hook
    const {
        messages,
        loading,
        sendMessage,
        setMessages,
        clearHistory,
        handleConfirmAction,
        handleConfirmEdit,
        handleConfirmDelete
    } = useChatLogic({
        transactions,
        reminders,
        onTransaction,
        onReminder,
        budgets,
        saveBudget
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isFullScreen]);

    // Sync global flag with React state (fixes regression where flag gets out of sync)
    useEffect(() => {
        (window as any).isPbookChatOpen = isOpen;
        return () => {
            (window as any).isPbookChatOpen = false;
        };
    }, [isOpen]);

    // Smart suggestions
    const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
    useEffect(() => {
        setSmartSuggestions(getSmartSuggestions(transactions));
    }, [transactions, isOpen]);
    const baseSuggestions = smartSuggestions;

    const checkMobile = () => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768; // md breakpoint
        }
        return false;
    };

    const handleOpen = () => {
        console.log("[DashboardChat] Opening chat");
        // Set global flag for back button handling
        (window as any).isPbookChatOpen = true;

        setIsOpen(true);
        if (checkMobile()) {
            setIsFullScreen(true);
        } else {
            setIsFullScreen(false);
        }
        // Push hash state so Android back button closes chat instead of exiting
        if (window.location.hash !== '#chat') {
            console.log("[DashboardChat] Pushing #chat state");
            window.history.pushState({ chatOpen: true }, '', '#chat');
        }
    };

    const handleClose = () => {
        console.log("[DashboardChat] Closing chat");
        // Clear global flag
        (window as any).isPbookChatOpen = false;

        setIsOpen(false);
        setIsFullScreen(false);
        setIsMinimized(false);
        setMessages([]);
        clearHistory();
        setInput("");
        // Pop the hash if closing manually (X button)
        if (window.location.hash === '#chat') {
            console.log("[DashboardChat] Removing #chat state manually");
            window.history.back();
        }
    };

    // Listen for back button (popstate) to close chat
    useEffect(() => {
        const handlePopState = () => {
            console.log("[DashboardChat] PopState event detected. Hash:", window.location.hash);

            // Sync global flag just in case
            if (window.location.hash !== '#chat') {
                (window as any).isPbookChatOpen = false;
            }

            // If the hash is gone (meaning we went back), close the chat
            if (isOpen && window.location.hash !== '#chat') {
                console.log("[DashboardChat] Closing chat from PopState");
                setIsOpen(false);
                setIsFullScreen(false);
                setIsMinimized(false);
                setMessages([]);
                clearHistory();
                setInput("");
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen]);

    const handleMinimize = () => {
        setIsMinimized(true);
        setIsFullScreen(false);
    };

    const handleRestore = () => {
        setIsMinimized(false);
    };

    const handleSend = async (txt: string = input) => {
        if (!txt.trim()) return;
        if (!isOpen) handleOpen();
        setInput("");
        await sendMessage(txt);
    };

    const handlePromptClick = (prompt: string) => {
        setInput(prompt);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Full Screen View
    if (isOpen && isMinimized) {
        return (
            <button
                onClick={handleRestore}
                className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 animate-in slide-in-from-bottom-4"
            >
                <Sparkles size={18} />
                <span className="font-medium">Ask PocketBook</span>
                {messages.length > 0 && (
                    <span className="bg-white text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {messages.length}
                    </span>
                )}
            </button>
        );
    }

    if (isOpen && isFullScreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-xl">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">PocketBook Assistant</h2>
                            <p className="text-xs text-gray-500">Your personal finance AI</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {messages.length > 0 && (
                            <button onClick={clearHistory} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 flex items-center gap-1 text-xs" title="Clear Context">
                                <RefreshCw size={16} />
                                <span className="hidden md:inline">Clear</span>
                            </button>
                        )}
                        <button onClick={() => setIsFullScreen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hidden md:block" title="Minimize">
                            <Minimize2 size={20} />
                        </button>
                        <button onClick={handleClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <MessageList
                    messages={messages}
                    loading={loading}
                    onConfirmAction={handleConfirmAction}
                    onConfirmEdit={handleConfirmEdit}
                    onConfirmDelete={handleConfirmDelete}
                    onPromptClick={handlePromptClick}
                    messagesEndRef={messagesEndRef}
                    variant="fullscreen"
                    emptyState={
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
                            <Sparkles size={48} className="text-blue-300 infinite animate-pulse" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">How can I help you today?</h3>
                                <p className="text-gray-500">I can analyze your spending, set reminders, or log transactions.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                                {baseSuggestions.slice(0, 4).map((s, i) => (
                                    <button key={i} onClick={() => handlePromptClick(s)} className="p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left shadow-sm">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    }
                />

                <ChatInput
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    loading={loading}
                    variant="fullscreen"
                    externalRef={inputRef}
                    autoFocus={true}
                />
            </div>
        );
    }

    // Minimized View
    return (
        <div className={`w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden transition-all duration-300 ${isOpen ? 'fixed bottom-6 right-6 z-50 w-[400px] h-[600px] shadow-2xl ring-4 ring-black/5 flex flex-col' : ''}`}>
            <div className={`flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 ${!isOpen ? 'hidden' : ''}`}>
                <div className="flex items-center gap-2 text-blue-600 font-bold px-2">
                    <Sparkles size={18} />
                    <span>Ask PocketBook</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleMinimize} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500" title="Minimize">
                        <Minimize2 size={16} />
                    </button>
                    <button onClick={() => setIsFullScreen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500" title="Expand to Full Screen">
                        <Maximize2 size={16} />
                    </button>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400" title="Close">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {isOpen ? (
                <>
                    <MessageList
                        messages={messages}
                        loading={loading}
                        onConfirmAction={handleConfirmAction}
                        onConfirmEdit={handleConfirmEdit}
                        onConfirmDelete={handleConfirmDelete}
                        onPromptClick={handlePromptClick}
                        messagesEndRef={messagesEndRef}
                        variant="compact"
                        emptyState={
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 opacity-80 h-full">
                                <Sparkles size={32} className="text-blue-300 infinite animate-pulse" />
                                <div>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-300">How can I help you today?</h3>
                                    <p className="text-xs text-gray-500 max-w-[200px] mx-auto">I can analyze your spending, set reminders, or log transactions.</p>
                                </div>
                                <div className="flex flex-col gap-2 w-full px-2">
                                    {baseSuggestions.slice(0, 4).map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePromptClick(s)}
                                            className="text-left text-xs p-3 bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl border border-gray-100 shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            <Sparkles size={12} className="opacity-50 text-blue-400" /> {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        }
                    />
                    <ChatInput
                        input={input}
                        setInput={setInput}
                        handleSend={handleSend}
                        loading={loading}
                        variant="compact"
                        externalRef={inputRef}
                        autoFocus={true}
                    />
                </>
            ) : (
                <ChatInput
                    input=""
                    setInput={() => { }}
                    handleSend={() => { }}
                    loading={false}
                    variant="start"
                    onFocus={handleOpen}
                />
            )}
        </div>
    );
}
