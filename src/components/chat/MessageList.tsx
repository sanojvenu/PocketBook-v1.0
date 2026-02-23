import { RefObject } from "react";
import { Message } from "@/types";
import { ChatMessage } from "./ChatMessage";

interface MessageListProps {
    messages: Message[];
    loading: boolean;
    onConfirmAction: (msgId: string, data: any, type: 'transaction' | 'reminder' | 'cleanup') => void;
    onConfirmEdit: (msgId: string, itemId: string, itemType: 'transaction' | 'reminder', changes: any) => void;
    onConfirmDelete: (msgId: string, itemId: string, itemType: 'transaction' | 'reminder') => void;
    onPromptClick: (prompt: string) => void;
    messagesEndRef: RefObject<HTMLDivElement | null>;
    variant?: 'fullscreen' | 'compact';
    emptyState?: React.ReactNode;
}

export function MessageList({ messages, loading, onConfirmAction, onConfirmEdit, onConfirmDelete, onPromptClick, messagesEndRef, variant = 'fullscreen', emptyState }: MessageListProps) {
    if (messages.length === 0 && emptyState) {
        return <>{emptyState}</>; // Render empty state directly if no messages
    }

    return (
        <div className={`flex-1 min-h-0 overflow-y-auto ${variant === 'fullscreen' ? 'p-4 md:p-8 space-y-6 bg-gray-50/50 dark:bg-black/20 container mx-auto max-w-4xl' : 'p-4 space-y-4 bg-gray-50/30'}`}>
            {messages.map((msg) => (
                <ChatMessage
                    key={msg.id}
                    message={msg}
                    onConfirmAction={onConfirmAction}
                    onConfirmEdit={onConfirmEdit}
                    onConfirmDelete={onConfirmDelete}
                    onPromptClick={onPromptClick}
                    variant={variant}
                />
            ))}
            {loading && (
                <div className={`flex flex-col items-start ${variant === 'fullscreen' ? 'animate-in slide-in-from-bottom-2' : 'px-2 py-1'}`}>
                    <div className={`${variant === 'fullscreen' ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none p-4 shadow-sm' : 'bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3'}`}>
                        <div className="flex gap-1">
                            <div className={`w-${variant === 'fullscreen' ? '2' : '1.5'} h-${variant === 'fullscreen' ? '2' : '1.5'} ${variant === 'fullscreen' ? 'bg-blue-400' : 'bg-gray-400'} rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
                            <div className={`w-${variant === 'fullscreen' ? '2' : '1.5'} h-${variant === 'fullscreen' ? '2' : '1.5'} ${variant === 'fullscreen' ? 'bg-blue-400' : 'bg-gray-400'} rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
                            <div className={`w-${variant === 'fullscreen' ? '2' : '1.5'} h-${variant === 'fullscreen' ? '2' : '1.5'} ${variant === 'fullscreen' ? 'bg-blue-400' : 'bg-gray-400'} rounded-full animate-bounce`}></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}
