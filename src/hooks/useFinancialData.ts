"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { TransactionService } from "@/services/TransactionService";
import { ReminderService } from "@/services/ReminderService";

export interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    tags: string[];
    date: any; // Firestore Timestamp
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

export function useFinancialData() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fetch Transactions via Service
        const unsubTransactions = TransactionService.subscribeTransactions(user.uid, (data) => {
            setTransactions(data);
        });

        // Fetch Reminders via Service
        const unsubReminders = ReminderService.subscribeReminders(user.uid, (data) => {
            setReminders(data);
            setLoading(false);
        });

        return () => {
            unsubTransactions();
            unsubReminders();
        };
    }, [user]);

    // Actions
    const addTransaction = async (data: any) => {
        if (!user) return;
        try {
            let transactionDate = new Date();
            if (data.date) {
                // If date is "2024-02-04", construct Date object correctly (local time issue handling)
                const [y, m, d] = data.date.split('-').map(Number);
                transactionDate = new Date(y, m - 1, d);
            }

            await TransactionService.addTransaction(user.uid, {
                ...data,
                date: transactionDate
            });
            // toast.success("Transaction added!"); // Optional: Let UI handle toast
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const addReminder = async (data: any) => {
        if (!user) return;
        try {
            await ReminderService.addReminder(user.uid, {
                ...data,
                completed: false
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return {
        transactions,
        reminders,
        loading,
        addTransaction,
        addReminder
    };
}
