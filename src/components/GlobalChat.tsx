"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Maximize2, Minimize2, X, Bot, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useBudgets } from "@/hooks/useBudgets";
import { useChatLogic } from "@/hooks/useChatLogic";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { ChatInput } from "./chat/ChatInput";
import { MessageList } from "./chat/MessageList";

export default function GlobalChat() {
    // 1. Hook Integration
    const { transactions, reminders, addTransaction, addReminder } = useFinancialData();
    const { budgets, saveBudget } = useBudgets();
    const viewportHeight = useVisualViewport();

    // 2. State
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
        addTransaction,
        addReminder,
        budgets,
        saveBudget
    });

    // Event Listener for Toggle
    useEffect(() => {
        const handleToggle = () => {
            setIsOpen(prev => {
                const newState = !prev;
                if (newState) {
                    if (window.innerWidth < 768) setIsFullScreen(true);
                    if (window.location.hash !== '#chat') {
                        window.history.pushState({ chatOpen: true }, '', '#chat');
                    }
                } else {
                    // If closing via toggle, maybe go back? 
                    // Usually toggle just closes. Logic in handleClose handles back() if needed.
                }
                return newState;
            });
        };

        const handleOpenEvent = () => {
            setIsOpen(true);
            if (window.innerWidth < 768) {
                setIsFullScreen(true);
            }
            // Fix: Push hash state so AppInitializer knows to use history.back()
            if (window.location.hash !== '#chat') {
                window.history.pushState({ chatOpen: true }, '', '#chat');
            }
        };

        window.addEventListener('toggle-chat', handleToggle);
        window.addEventListener('open-chat', handleOpenEvent);
        return () => {
            window.removeEventListener('toggle-chat', handleToggle);
            window.removeEventListener('open-chat', handleOpenEvent);
        };
    }, []);

    // Sync global flag for AppInitializer (Back Button Handler)
    useEffect(() => {
        (window as any).isPbookChatOpen = isOpen;
        return () => {
            (window as any).isPbookChatOpen = false;
        };
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        if (isOpen && inputRef.current) {
            // setTimeout to allow animation to start/finish
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [messages, isOpen, isFullScreen]);

    // Helper to determine if mobile
    const checkMobile = () => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 768; // md breakpoint
        }
        return false;
    };

    useEffect(() => {
        const handleHashChange = () => {
            if (isOpen && window.location.hash !== '#chat') {
                handleClose();
            }
        };

        window.addEventListener('popstate', handleHashChange);
        return () => window.removeEventListener('popstate', handleHashChange);
    }, [isOpen]);

    const handleOpen = () => {
        setIsOpen(true);
        if (checkMobile()) {
            setIsFullScreen(true);
        } else {
            setIsFullScreen(false); // Default to compact on desktop
        }

        // Push hash state if not already there
        if (window.location.hash !== '#chat') {
            window.history.pushState({ chatOpen: true }, '', '#chat');
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsFullScreen(false);
        setIsMinimized(false);
        setMessages([]);
        clearHistory();
        setInput("");

        // If closing manually and hash is present, go back to remove it
        if (window.location.hash === '#chat') {
            window.history.back();
        }
    };

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

    // Initial Suggestions
    const [baseSuggestions, setBaseSuggestions] = useState<string[]>([]);

    useEffect(() => {
        // Load smart suggestions when opening or when transactions change
        import("@/lib/insightsEngine").then(mod => {
            setBaseSuggestions(mod.getSmartSuggestions(transactions));
        });
    }, [transactions, isOpen]);

    if (!isOpen) return null;

    // Minimized Pill View
    if (isMinimized) {
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

    // Render Full Screen
    if (isFullScreen) {
        return (
            <div
                className="fixed top-0 left-0 right-0 z-[100] bg-white dark:bg-gray-950 flex flex-col animate-in fade-in duration-200"
                style={{ height: viewportHeight > 0 ? `${viewportHeight}px` : '100dvh' }}
            >
                {/* Full Screen Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-xl">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg"><span className="text-[#073449]">Pocket</span><span className="text-[#F07E23]">Book</span> AI</h2>
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

                {/* Chat Content */}
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

                {/* Input Bar */}
                <ChatInput
                    input={input}
                    setInput={setInput}
                    handleSend={handleSend}
                    loading={loading}
                    variant="fullscreen"
                    externalRef={inputRef}
                    autoFocus={true} // Focus when opened in fullscreen
                />
            </div>
        )
    }

    // Minimized / Compact View
    return (
        <div className={`w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden transition-all duration-300 fixed bottom-6 right-6 z-50 w-[400px] h-[600px] shadow-2xl ring-4 ring-black/5 flex flex-col animate-in slide-in-from-bottom-6`}>

            {/* Collapsed Header */}
            <div className={`flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900`}>
                <div className="flex items-center gap-2 text-blue-600 font-bold px-2">
                    <Sparkles size={18} />
                    <span><span className="text-[#073449]">Pocket</span><span className="text-[#F07E23]">Book</span> AI</span>
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

            {/* Content for Minimized Modal */}
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
        </div>
    );
}
