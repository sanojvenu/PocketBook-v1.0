export interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    tags: string[];
    data?: any; // For charts, stats, custom UI. Now supports chartData: { title: string, data: { name: string, value: number, color: string }[] }
    date: any; // Firestore Timestamp or Date or string
    category?: string;
    description?: string;
}

export interface Reminder {
    id: string;
    title: string;
    amount: number;
    date: string;
    recurrence: string;
    completed: boolean;
    type: 'pay' | 'collect';
    tags?: string[];
}

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    data?: any;
    type?: "text" | "confirmation-transaction" | "confirmation-reminder" | "stats" | "breakdown" | "insight" | "budget" | "edit-confirm" | "delete-confirm" | "subscription" | "category-cleanup" | "scenario-simulation" | "chart" | "action-card" | "health_score";
    nextPrompts?: string[];
    saved?: boolean;
}
