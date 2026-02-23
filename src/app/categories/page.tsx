"use client";

import { useState } from "react";
import { useCategories, Category } from "@/hooks/useCategories";
import { Trash2, Plus, Tag, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

export default function CategoriesPage() {
    const { categories, loading, addCategory, deleteCategory } = useCategories();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<'income' | 'expense' | 'both'>('expense');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        // Check duplicate
        if (categories.some(c => c.name.toLowerCase() === newName.trim().toLowerCase())) {
            toast.error("Category already exists");
            return;
        }

        await addCategory(newName.trim(), newType);
        setNewName("");
        setNewType("expense");
        setIsAddModalOpen(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"? Existing transactions with this category will keep the text tag but lose the category association.`)) {
            await deleteCategory(id);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading categories...</div>;

    const incomeCats = categories.filter(c => c.type === 'income' || c.type === 'both');
    const expenseCats = categories.filter(c => c.type === 'expense' || c.type === 'both');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Tag className="text-blue-500" /> Categories
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your transaction labels.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20"
                >
                    <Plus size={20} /> <span className="hidden sm:inline">Add Category</span>
                </button>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Income Column */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-emerald-600 flex items-center gap-2 border-b pb-2 border-emerald-100">
                        Income Categories
                    </h2>
                    <div className="grid gap-3">
                        {incomeCats.map(cat => (
                            <CategoryItem key={cat.id} category={cat} onDelete={handleDelete} />
                        ))}
                    </div>
                </div>

                {/* Expense Column */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-rose-600 flex items-center gap-2 border-b pb-2 border-rose-100">
                        Expense Categories
                    </h2>
                    <div className="grid gap-3">
                        {expenseCats.map(cat => (
                            <CategoryItem key={cat.id} category={cat} onDelete={handleDelete} />
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="New Category"
            >
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Gym, Spotify, Bonus"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setNewType('income')}
                                className={`p-3 rounded-xl border-2 font-bold transition-all ${newType === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-emerald-200'}`}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                onClick={() => setNewType('expense')}
                                className={`p-3 rounded-xl border-2 font-bold transition-all ${newType === 'expense' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-500 hover:border-rose-200'}`}
                            >
                                Expense
                            </button>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newName}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function CategoryItem({ category, onDelete }: { category: Category, onDelete: (id: string, name: string) => void }) {
    return (
        <div className="glass-panel p-3 px-4 flex items-center justify-between group hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || '#9ca3af' }} />
                <span className="font-medium">{category.name}</span>
                {category.isDefault && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Default</span>}
            </div>
            {!category.isDefault && (
                <button
                    onClick={() => onDelete(category.id, category.name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
}
