"use client";

import { useState } from "react";
import { Camera, Mic, Loader2, Sparkles, X, Tag, ArrowUpRight, Info, Calculator } from "lucide-react";
import { aiService } from "@/lib/aiService";
import { toast } from "sonner";
import CalculatorPad from "./CalculatorPad";
import { Capacitor } from "@capacitor/core";
import { useSmartInput } from "@/hooks/useSmartInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const reminderSchema = z.object({
    title: z.string().min(1, "Title is required"),
    amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
    date: z.string().min(1, "Date is required"),
    time: z.string().optional(),
    recurrence: z.string().default("none"),
    type: z.enum(["pay", "collect"]),
    tags: z.array(z.string()).default([]),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

interface AddReminderFormProps {
    onAdd: (data: { title: string; amount: number; date: string; time?: string; recurrence?: string; type: 'pay' | 'collect'; tags: string[] }) => Promise<void>;
    onCancel: () => void;
    initialData?: any;
}

export default function AddReminderForm({ onAdd, onCancel, initialData }: AddReminderFormProps) {
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [isCalcInfoOpen, setIsCalcInfoOpen] = useState(false);
    const [isTagsInfoOpen, setIsTagsInfoOpen] = useState(false);
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReminderFormValues>({
        resolver: zodResolver(reminderSchema) as any,
        defaultValues: {
            title: initialData?.title || "",
            amount: initialData?.amount ? Number(initialData.amount) : undefined,
            date: initialData?.date || "",
            time: initialData?.time || "",
            recurrence: initialData?.recurrence || "none",
            type: initialData?.type || "pay",
            tags: initialData?.tags || [],
        }
    });

    const type = watch("type");
    const tags = watch("tags") || [];

    const onImageProcessed = (data: any) => {
        if (data.title) setValue("title", data.title);
        if (data.amount) setValue("amount", Number(data.amount));
        if (data.date) setValue("date", data.date);
        if (data.time) setValue("time", data.time);
        if (data.transactionType) setValue("type", data.transactionType === 'income' ? 'collect' : 'pay');
    };

    const onVoiceProcessed = (transcript: string) => {
        setTextInput(transcript);
        setShowTextInput(true);
    };

    const {
        aiProcessing,
        setAiProcessing,
        fileInputRef,
        handleVoiceInput,
        handleCameraInput,
        handleImageUpload
    } = useSmartInput({ onImageProcessed, onVoiceProcessed });

    const submitForm = async (data: any) => {
        setLoading(true);
        try {
            await onAdd({
                title: data.title,
                amount: data.amount,
                date: data.date,
                time: data.time,
                recurrence: data.recurrence,
                type: data.type,
                tags: data.tags,
            });
            // Let the parent unmount this component rather than clearing the data, to preserve consistency.
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const { onChange: amountOnChange, onBlur: amountOnBlur, name: amountName, ref: amountRef } = register("amount");

    const handleAmountEval = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
        try {
            const val = e.currentTarget.value;
            if (!val) return;
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

    const handleAnalyzeText = async (textToAnalyze: string = textInput) => {
        if (!textToAnalyze.trim()) return;

        setAiProcessing(true);
        setError(null);
        try {
            const data = await aiService.parseReminderWithGemini(textToAnalyze);
            if (Object.keys(data).length === 0) {
                setError("Could not extract details. Please check your API Key or try again.");
                return;
            }

            if (data.title) setValue("title", data.title);
            if (data.amount) setValue("amount", Number(data.amount));
            if (data.date) setValue("date", data.date);
            if (data.time) setValue("time", data.time);
            if (data.transactionType) setValue("type", data.transactionType === 'income' ? 'collect' : 'pay');
            if (data.tags) setValue("tags", data.tags);

            toast.success("Reminder details extracted!");
            setShowTextInput(false);
            setTextInput("");
        } catch (e: any) {
            console.error("Component Error:", e);
            setError(e.message || "Failed to process text. Please try again.");
        } finally {
            setAiProcessing(false);
        }
    };

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

    return (
        <div className="space-y-3">
            {error && (
                <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs border border-red-100">
                    {error}
                </div>
            )}

            {/* AI Input Section */}
            {!initialData && (
                <div className="space-y-2 mb-4">
                    <div className="relative">
                        {Capacitor.isNativePlatform() ? (
                            <div className="absolute left-2 top-2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleCameraInput}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    aria-label="Scan using camera"
                                >
                                    <Camera size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleVoiceInput}
                                    className={`p-1 rounded-lg transition-colors ${aiProcessing ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-blue-600'}`}
                                    aria-label="Use voice input"
                                >
                                    <Mic size={16} className={aiProcessing ? 'animate-pulse' : ''} />
                                </button>
                            </div>
                        ) : (
                            <div className="absolute left-3 top-3 text-blue-500">
                                <Sparkles size={16} />
                            </div>
                        )}
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Ask PocketBook... (e.g., 'Pay rent')"
                            className={`w-full ${Capacitor.isNativePlatform() ? 'pl-[70px]' : 'pl-9'} pr-10 py-2.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAnalyzeText(textInput);
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => handleAnalyzeText(textInput)}
                            disabled={aiProcessing || !textInput.trim()}
                            className="absolute right-2 top-2 p-1 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                            aria-label="Analyze text"
                        >
                            {aiProcessing ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            )}

            <form onSubmit={handleSubmit(submitForm)} className="space-y-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
                    <input
                        type="text"
                        {...register("title")}
                        placeholder="e.g. Internet Bill"
                        className={`w-full px-3 py-2 rounded-lg border ${errors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-blue-600 transition-all outline-none text-sm`}
                    />
                    {errors.title && <p className="text-[10px] text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Type</label>
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setValue("type", "pay")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'pay' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pay (Out)
                        </button>
                        <button
                            type="button"
                            onClick={() => setValue("type", "collect")}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${type === 'collect' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Collect (In)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Amount (₹)</label>
                            <button
                                type="button"
                                onClick={() => setIsCalcInfoOpen(true)}
                                className="text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <Info size={12} />
                            </button>
                        </div>
                        <div className="relative">
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
                                placeholder="0.00"
                                className={`w-full px-3 py-2 pr-10 rounded-lg border ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-blue-600 transition-all outline-none text-sm`}
                            />
                            <button
                                type="button"
                                onClick={() => setIsCalculatorOpen(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                aria-label="Open Calculator"
                            >
                                <Calculator size={16} />
                            </button>
                        </div>
                        {errors.amount && <p className="text-[10px] text-red-500 mt-1">{errors.amount.message}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Recurrence</label>
                        <select
                            {...register("recurrence")}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-all outline-none text-sm"
                        >
                            <option value="none">One-time</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Due Date</label>
                        <input
                            type="date"
                            {...register("date")}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.date ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-blue-600 transition-all outline-none text-sm`}
                        />
                        {errors.date && <p className="text-[10px] text-red-500 mt-1">{errors.date.message}</p>}
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Time (Optional)</label>
                        <input
                            type="time"
                            {...register("time")}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-600 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-blue-600 transition-all outline-none text-sm"
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
                    <div className="w-full p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 focus-within:border-blue-600 dark:focus-within:border-blue-500 transition-all flex flex-wrap gap-2 items-center min-h-[38px]">
                        {tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                <Tag size={10} className="mr-1" />
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 text-blue-400 hover:text-blue-600 focus:outline-none"
                                    aria-label="Remove tag"
                                >
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 min-w-[60px]"
                            placeholder={tags.length === 0 ? "Add tags..." : ""}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2 border-t mt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || aiProcessing}
                        className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {initialData ? "Save" : "Add Reminder"}
                    </button>
                </div>
            </form>

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
                            <p>Tags help you categorize and search for your reminders later.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Type a tag word (e.g. <strong>bills</strong>)</li>
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
