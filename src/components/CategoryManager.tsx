import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Trash2, Plus, Tag, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function CategoryManager() {
    const { categories, loading, addCategory, deleteCategory } = useCategories();

    // Form State
    const [newName, setNewName] = useState("");
    const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
    const [isAddingString, setIsAddingString] = useState(false); // UI state for adding new

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        // Check duplicate
        if (categories.some(c => c.name.toLowerCase() === newName.trim().toLowerCase())) {
            toast.error("Category already exists");
            return;
        }

        await addCategory(newName.trim(), activeTab);
        setNewName("");
        setIsAddingString(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Delete "${name}"?`)) {
            await deleteCategory(id);
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

    const currentCategories = categories.filter(c => c.type === activeTab || c.type === 'both');

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('expense')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-gray-700 shadow-sm text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Expense
                </button>
                <button
                    onClick={() => setActiveTab('income')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'income' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Income
                </button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {currentCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl group">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#9ca3af' }} />
                            <span className="font-medium text-sm">{cat.name}</span>
                            {cat.isDefault && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                        {!cat.isDefault && (
                            <button
                                onClick={() => handleDelete(cat.id, cat.name)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add New Input */}
            {isAddingString ? (
                <form onSubmit={handleAdd} className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                    <input
                        autoFocus
                        type="text"
                        placeholder="New Category Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newName}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Check size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAddingString(false)}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <X size={16} />
                    </button>
                </form>
            ) : (
                <button
                    onClick={() => setIsAddingString(true)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 hover:dark:bg-blue-900/30 rounded-xl transition-colors border border-blue-200 dark:border-blue-800"
                >
                    <Plus size={16} /> Add New {activeTab === 'income' ? 'Income' : 'Expense'} Category
                </button>
            )}
        </div>
    );
}
