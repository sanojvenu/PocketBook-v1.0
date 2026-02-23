"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { BudgetService, BudgetData as Budget } from "@/services/BudgetService";

export type { Budget };



export function useBudgets() {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch budgets
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const unsubscribe = BudgetService.subscribeBudgets(
            user.uid,
            (data) => {
                setBudgets(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching budgets:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Create or update budget
    const saveBudget = useCallback(async (data: Omit<Budget, 'id'> & { id?: string }) => {
        if (!user) return;

        try {
            const budgetId = await BudgetService.saveBudget(user.uid, data);
            toast.success(`Budget for ${data.category} saved!`);
            return budgetId;
        } catch (error) {
            console.error("Error saving budget:", error);
            toast.error("Failed to save budget");
            throw error;
        }
    }, [user]);

    // Delete budget
    const deleteBudget = useCallback(async (budgetId: string) => {
        if (!user) return;

        try {
            await BudgetService.deleteBudget(user.uid, budgetId);
            toast.success("Budget deleted");
        } catch (error) {
            console.error("Error deleting budget:", error);
            toast.error("Failed to delete budget");
            throw error;
        }
    }, [user]);

    // Get budget for specific category
    const getBudgetForCategory = useCallback((category: string): Budget | undefined => {
        return budgets.find(b => b.category.toLowerCase() === category.toLowerCase());
    }, [budgets]);

    return {
        budgets,
        loading,
        saveBudget,
        deleteBudget,
        getBudgetForCategory
    };
}
