"use client";

import { useState } from "react";
import { Mic, Sparkles, Loader2, X, Camera as CameraIcon, Tag, ArrowUpRight, Settings, Info, Calculator } from "lucide-react";
import { aiService } from "@/lib/aiService";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import CategoryManager from "./CategoryManager";
import CalculatorPad from "./CalculatorPad";
import { Capacitor } from "@capacitor/core";
import { useSmartInput } from "@/hooks/useSmartInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const transactionSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    description: z.string().min(1, "Description is required"),
    category: z.string().min(1, "Category is required"),
    type: z.enum(["expense", "income"]),
    date: z.string().min(1, "Date is required"),
    time: z.string().optional(),
    tags: z.array(z.string()).default([]),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface AddTransactionFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    initialData?: any;
}

export default function AddTransactionForm({ onSubmit, onCancel, initialData }: AddTransactionFormProps) {
    const [loading, setLoading] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [isCalcInfoOpen, setIsCalcInfoOpen] = useState(false);
    const [isTagsInfoOpen, setIsTagsInfoOpen] = useState(false);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const defaultDate = initialData?.date ? (initialData.date instanceof Date ? initialData.date.toISOString().split('T')[0] : initialData.date.split('T')[0]) : new Date().toISOString().split('T')[0];
    const defaultTime = initialData?.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            amount: initialData?.amount ? Number(initialData.amount) : undefined,
            description: initialData?.description || "",
            category: initialData?.category || "Food",
            type: initialData?.type || "expense",
            date: defaultDate,
            time: defaultTime,
            tags: initialData?.tags || [],
        }
    });

    const type = watch("type");
    const tags = watch("tags") || [];

    // Categories
    const { categories } = useCategories();
    const availableCategories = categories.filter(c => c.type === 'both' || c.type === type);

    const onImageProcessed = (parsed: any) => {
        if (parsed.amount) setValue("amount", Number(parsed.amount));
        if (parsed.description) setValue("description", parsed.description);
        if (parsed.category) setValue("category", parsed.category);
        setValue("type", "expense");
        if (parsed.date) setValue("date", parsed.date);
        if (parsed.tags) setValue("tags", parsed.tags);
    };

    const {
        aiMode,
        setAiMode,
        aiInput,
        setAiInput,
        aiProcessing,
        setAiProcessing,
        handleVoiceInput,
        handleCameraInput,
    } = useSmartInput({ onImageProcessed });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = tagInput.trim();
            if (value && !tags.includes(value)) {
                setValue("tags", [...tags, value]);
                setTagInput("");
            }
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setValue("tags", tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setValue("tags", tags.filter(tag => tag !== tagToRemove));
    };

    const handleProcessAI = async () => {
        if (!aiInput.trim()) return;

        setAiProcessing(true);
        try {
            const parsed = await aiService.parseTransactionWithGemini(aiInput);

            if (parsed.amount) setValue("amount", Number(parsed.amount));
            if (parsed.description) setValue("description", parsed.description || aiInput);
            if (parsed.category) setValue("category", parsed.category);

            const parsedType = (parsed.type === 'income' || parsed.type === 'expense') ? parsed.type : 'expense';
            setValue("type", parsedType as "expense" | "income");

            if (parsed.date) setValue("date", parsed.date);
            if (parsed.time) setValue("time", parsed.time);
            if (parsed.tags) setValue("tags", parsed.tags);

            toast.success("Processed successfully!");
            setAiInput("");
            setAiMode(null);

        } catch (e: any) {
            console.error("AI Processing Error", e);
            toast.error(e.message || "Failed to process input");
        } finally {
            setAiProcessing(false);
        }
    };

    const submitForm = async (data: any) => {
        setLoading(true);
        try {
            await onSubmit(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const { onChange: amountOnChange, onBlur: amountOnBlur, name: amountName, ref: amountRef } = register("amount");

    const handleAmountEval = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
        try {
            const val = e.currentTarget.value;
            if (!val) return;
            // Only evaluate if it contains math operators
            if (/[+\-*/]/.test(val)) {
                const sanitized = val.replace(/[^0-9+\-*/.()]/g, '');
                if (sanitized) {
                    // eslint-disable-next-line no-new-func
                    const evaluated = new Function(`return ${sanitized}`)();
                    if (!isNaN(evaluated) && isFinite(evaluated)) {
                        const rounded = Number(evaluated.toFixed(2));
                        setValue("amount", rounded, { shouldValidate: true });
                    }
                }
            }
        } catch (err) {
            // ignore invalid math expressions
        }
    };

    return (
        <div className="space-y-6">
            {/* AI Input Section */}
            {!initialData && (
                <div className="space-y-3 mb-6">
                    <div className="relative">
                        {Capacitor.isNativePlatform() ? (
                            <div className="absolute left-2 top-2.5 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleCameraInput}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    aria-label="Scan image"
                                >
                                    <CameraIcon size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleVoiceInput}
                                    className={`p-1 rounded-lg transition-colors ${aiMode === 'voice' ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-blue-600'}`}
                                    aria-label="Voice input"
                                >
                                    <Mic size={16} className={aiMode === 'voice' ? 'animate-pulse' : ''} />
                                </button>
                            </div>
                        ) : (
                            <div className="absolute left-3 top-3.5 text-blue-500">
                                <Sparkles size={18} />
                            </div>
                        )}
                        <input
                            type="text"
                            value={aiInput}
                            onChange={(e) => {
                                setAiInput(e.target.value);
                                if (!aiMode) setAiMode("text");
                            }}
                            placeholder="Ask PocketBook... (e.g., 'Lunch 500')"
                            className={`w-full ${Capacitor.isNativePlatform() ? 'pl-[70px]' : 'pl-10'} pr-12 py-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleProcessAI();
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={handleProcessAI}
                            disabled={!aiInput.trim() || aiProcessing}
                            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                            aria-label="Process with AI"
                        >
                            {aiProcessing ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Manual Entry Form */}
            <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base">{initialData ? "Edit Transaction" : "Manual Entry"}</h3>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setValue("type", "expense")}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${type === 'expense' ? 'bg-white text-rose-500 shadow-sm dark:bg-gray-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            Cash Out
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue("type", "income")}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${type === 'income' ? 'bg-white text-emerald-500 shadow-sm dark:bg-gray-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                        >
                            Cash In
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="flex items-center gap-1 mb-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Amount</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCalcInfoOpen(true)}
                                    className="text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    <Info size={12} />
                                </button>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-primary transition-colors">₹</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    name={amountName}
                                    ref={amountRef}
                                    onChange={amountOnChange}
                                    onBlur={(e) => {
                                        handleAmountEval(e);
                                        amountOnBlur(e);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === '=') {
                                            const val = e.currentTarget.value;
                                            if (/[+\-*/]/.test(val)) {
                                                e.preventDefault();
                                                handleAmountEval(e);
                                            }
                                        }
                                    }}
                                    className={`w-full p-2.5 pl-8 pr-12 bg-white dark:bg-gray-900 border ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all font-mono text-base text-gray-900 dark:text-white caret-blue-600`}
                                    placeholder="0.00"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsCalculatorOpen(true)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                    aria-label="Open Calculator"
                                >
                                    <Calculator size={18} />
                                </button>
                            </div>
                            {errors.amount && <p className="text-[10px] text-red-500 mt-1">{errors.amount.message}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryManagerOpen(true)}
                                    className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1"
                                >
                                    <Settings size={10} /> Manage
                                </button>
                            </div>
                            <select
                                {...register("category")}
                                className={`w-full p-2.5 bg-white dark:bg-gray-900 border ${errors.category ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all appearance-none text-sm text-gray-900 dark:text-white cursor-pointer`}
                            >
                                {availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-[10px] text-red-500 mt-1">{errors.category.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                        <input
                            type="text"
                            {...register("description")}
                            className={`w-full p-2.5 bg-white dark:bg-gray-900 border ${errors.description ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-white caret-blue-600`}
                            placeholder="What was this for?"
                        />
                        {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Date</label>
                            <input
                                type="date"
                                {...register("date")}
                                className={`w-full p-2.5 bg-white dark:bg-gray-900 border ${errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-white caret-blue-600`}
                            />
                            {errors.date && <p className="text-[10px] text-red-500 mt-1">{errors.date.message}</p>}
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Time</label>
                            <input
                                type="time"
                                {...register("time")}
                                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-white caret-blue-600"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tags</label>
                            <button
                                type="button"
                                onClick={() => setIsTagsInfoOpen(true)}
                                className="text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <Info size={12} />
                            </button>
                        </div>
                        <div className="w-full p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all flex flex-wrap gap-2 items-center min-h-[42px]">
                            {tags.map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                    <Tag size={10} className="mr-1" />
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="ml-1 text-blue-400 hover:text-blue-600 focus:outline-none"
                                        aria-label="Remove tag"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 min-w-[80px]"
                                placeholder={tags.length === 0 ? "Add tags..." : ""}
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Save
                    </button>
                </div>
            </form >

            {/* Category Manager Modal - Nested Modal */}
            {isCategoryManagerOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold">Manage Categories</h3>
                            <button onClick={() => setIsCategoryManagerOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4">
                            <CategoryManager />
                        </div>
                    </div>
                </div>
            )}

            {/* Calculator Info Modal */}
            {isCalcInfoOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold">Amount Calculator</h3>
                            <button onClick={() => setIsCalcInfoOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                            <p>You can use the Amount field as a mini-calculator!</p>
                            <p>Tap the <strong>Calculator icon</strong> inside the field to open a dedicated math keypad. You can also type simple math equations directly into the box and it will calculate the total when you press <strong>Enter</strong>.</p>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 mt-2">
                                <p className="font-bold text-xs uppercase tracking-wider text-gray-500">Examples:</p>
                                <div className="grid grid-cols-2 gap-2 text-sm font-mono text-blue-600 dark:text-blue-400">
                                    <span>50 + 20</span><span>👉 70</span>
                                    <span>100 - 30</span><span>👉 70</span>
                                    <span>10 * 5</span><span>👉 50</span>
                                    <span>200 / 4</span><span>👉 50</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tags Info Modal */}
            {isTagsInfoOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold">Using Tags</h3>
                            <button onClick={() => setIsTagsInfoOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                            <p>Tags help you categorize and search for your transactions later.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Type a tag word (e.g. <strong>groceries</strong>)</li>
                                <li>Press <strong>Enter</strong> or <strong>Comma (,)</strong> to add the tag</li>
                                <li>Click the <strong>×</strong> on a tag to remove it</li>
                                <li>Press the <strong>Backspace</strong> key on an empty input to delete the last tag</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <CalculatorPad
                isOpen={isCalculatorOpen}
                initialValue={watch("amount")?.toString() || ""}
                onClose={() => setIsCalculatorOpen(false)}
                onCalculate={(val) => setValue("amount", val, { shouldValidate: true })}
            />
        </div>
    );
}
