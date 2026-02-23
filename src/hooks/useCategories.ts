"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { CategoryService, CategoryData as Category } from "@/services/CategoryService";

export type { Category }; // Re-export for existing imports

export function useCategories() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setCategories([]);
            setLoading(false);
            return;
        }

        const unsubscribe = CategoryService.subscribeCategories(user.uid, (data) => {
            setCategories(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCategory = async (name: string, type: 'income' | 'expense' | 'both', color?: string) => {
        if (!user) return;
        try {
            await CategoryService.addCategory(user.uid, name, type, color);
            toast.success("Category added");
        } catch (error) {
            console.error("Error adding category", error);
            toast.error("Failed to add category");
        }
    };

    const deleteCategory = async (id: string) => {
        if (!user) return;
        try {
            await CategoryService.deleteCategory(user.uid, id);
            toast.success("Category deleted");
        } catch (error) {
            console.error("Error deleting category", error);
            toast.error("Failed to delete category");
        }
    };

    return { categories, loading, addCategory, deleteCategory };
}
