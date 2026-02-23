import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface ActionCardWidgetProps {
    title: string;
    description?: string;
    amount?: number;
    type?: 'income' | 'expense' | 'neutral';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function ActionCardWidget({
    title,
    description,
    amount,
    type = 'neutral',
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel"
}: ActionCardWidgetProps) {

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 w-full mt-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{title}</h4>
                    {description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</p>}
                </div>
                {amount !== undefined && (
                    <div className={`font-bold text-right shrink-0 ${type === 'income' ? 'text-green-600' : type === 'expense' ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                        {type === 'income' ? '+' : type === 'expense' ? '-' : ''}₹{amount.toLocaleString('en-IN')}
                    </div>
                )}
            </div>

            {(onConfirm || onCancel) && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                            <XCircle size={16} /> {cancelText}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <CheckCircle2 size={16} /> {confirmText}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
