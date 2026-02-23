"use client";

import { useEffect, useState } from "react";
import { X, Delete } from "lucide-react";

interface CalculatorPadProps {
    isOpen: boolean;
    onClose: () => void;
    onCalculate: (value: number) => void;
    initialValue?: string;
}

export default function CalculatorPad({ isOpen, onClose, onCalculate, initialValue = "" }: CalculatorPadProps) {
    const [expression, setExpression] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            setExpression(initialValue || "");
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handlePress = (key: string) => {
        setExpression(prev => prev + key);
    };

    const handleDelete = () => {
        setExpression(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setExpression("");
    };

    const evaluateExpression = () => {
        try {
            if (!expression) {
                onCalculate(0);
                onClose();
                return;
            }

            // Allow only numbers and basic math operators
            const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
            if (!sanitized) return;

            // eslint-disable-next-line no-new-func
            const evaluated = new Function(`return ${sanitized}`)();
            if (!isNaN(evaluated) && isFinite(evaluated)) {
                const rounded = Number(evaluated.toFixed(2));
                onCalculate(rounded);
                onClose();
            }
        } catch (err) {
            // Invalid expression, ignore
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="flex-1 w-full" onClick={onClose} />

            <div className="bg-white dark:bg-gray-900 w-full rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-full duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="text-3xl font-mono px-2 overflow-x-auto whitespace-nowrap hide-scrollbar flex-1 text-right mr-4 tracking-wider text-gray-900 dark:text-white">
                        {expression || "0"}
                    </div>
                </div>

                <div className="p-4 grid grid-cols-4 gap-3 bg-gray-50/50 dark:bg-gray-900/50 max-w-sm mx-auto">
                    {/* Row 1 */}
                    <button type="button" onClick={handleClear} className="h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-xl active:scale-95 transition-all">C</button>
                    <button type="button" onClick={() => handlePress('(')} className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-2xl active:scale-95 transition-all">(</button>
                    <button type="button" onClick={() => handlePress(')')} className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-2xl active:scale-95 transition-all">)</button>
                    <button type="button" onClick={() => handlePress('/')} className="h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-3xl active:scale-95 transition-all">÷</button>

                    {/* Row 2 */}
                    <button type="button" onClick={() => handlePress('7')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">7</button>
                    <button type="button" onClick={() => handlePress('8')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">8</button>
                    <button type="button" onClick={() => handlePress('9')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">9</button>
                    <button type="button" onClick={() => handlePress('*')} className="h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-3xl active:scale-95 transition-all">×</button>

                    {/* Row 3 */}
                    <button type="button" onClick={() => handlePress('4')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">4</button>
                    <button type="button" onClick={() => handlePress('5')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">5</button>
                    <button type="button" onClick={() => handlePress('6')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">6</button>
                    <button type="button" onClick={() => handlePress('-')} className="h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-4xl active:scale-95 transition-all">−</button>

                    {/* Row 4 */}
                    <button type="button" onClick={() => handlePress('1')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">1</button>
                    <button type="button" onClick={() => handlePress('2')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">2</button>
                    <button type="button" onClick={() => handlePress('3')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">3</button>
                    <button type="button" onClick={() => handlePress('+')} className="h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-3xl active:scale-95 transition-all">+</button>

                    {/* Row 5 */}
                    <button type="button" onClick={() => handlePress('.')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold text-3xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">.</button>
                    <button type="button" onClick={() => handlePress('0')} className="h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium text-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-all">0</button>
                    <button type="button" onClick={handleDelete} className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xl active:scale-95 transition-all flex items-center justify-center">
                        <Delete size={24} />
                    </button>
                    <button type="button" onClick={evaluateExpression} className="h-14 rounded-2xl bg-blue-600 text-white font-bold text-3xl shadow-lg shadow-blue-600/30 active:scale-95 transition-all">=</button>
                </div>
                {/* Safe area padding for bottom of screens */}
                <div className="h-6 bg-gray-50/50 dark:bg-gray-900/50 w-full"></div>
            </div>
        </div>
    );
}
