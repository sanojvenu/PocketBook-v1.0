import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
    stats: {
        balance: number;
        income: number;
        expense: number;
    };
    durationLabel: string;
}

export default function DashboardStats({ stats, durationLabel }: DashboardStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
            {/* Balance Card */}
            <div className="col-span-2 md:col-span-1 p-4 md:p-6 rounded-2xl relative overflow-hidden group flex flex-col justify-center bg-[#f7be32] text-gray-900 shadow-xl shadow-[#f7be32]/20 border border-[#f7be32]/50">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-500 hidden md:block" />
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-[10px] md:text-sm font-semibold text-gray-800 mb-0.5 md:mb-1 uppercase md:normal-case">Total Balance</p>
                    <h2 className="text-xl md:text-4xl font-bold tracking-tight truncate">₹ {stats.balance.toLocaleString('en-IN')}</h2>
                    <div className="hidden md:flex items-center gap-2 mt-4 text-green-900 text-sm font-semibold">
                        <TrendingUp size={16} />
                        <span>updated just now</span>
                    </div>
                </div>
            </div>

            {/* Income Card */}
            <div className="glass-card p-2 md:p-6 flex flex-col justify-center">
                <div className="hidden md:flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <ArrowDownRight size={24} />
                    </div>
                    <span className="px-2.5 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-semibold text-gray-500">
                        Cash In
                    </span>
                </div>
                <div className="text-center md:text-left">
                    <p className="md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5 truncate">Income</p>
                    <h3 className="text-sm md:text-2xl font-bold text-emerald-600 md:text-foreground truncate">₹ {stats.income.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 truncate">{durationLabel}</p>
                </div>
            </div>

            {/* Expense Card */}
            <div className="glass-card p-2 md:p-6 flex flex-col justify-center">
                <div className="hidden md:flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <ArrowUpRight size={24} />
                    </div>
                    <span className="px-2.5 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-semibold text-gray-500">
                        Cash Out
                    </span>
                </div>
                <div className="text-center md:text-left">
                    <p className="md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5 truncate">Expense</p>
                    <h3 className="text-sm md:text-2xl font-bold text-rose-600 md:text-foreground truncate">₹ {stats.expense.toLocaleString('en-IN')}</h3>
                    <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 truncate">{durationLabel}</p>
                </div>
            </div>
        </div>
    );
}
