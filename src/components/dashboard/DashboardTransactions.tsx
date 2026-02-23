import { IndianRupee, Coffee } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SkeletonTransactionList } from "@/components/ui/Skeleton";
import { Transaction } from "@/types";

interface DashboardTransactionsProps {
    recentTransactions: Transaction[];
    dataLoading: boolean;
}

export default function DashboardTransactions({ recentTransactions, dataLoading }: DashboardTransactionsProps) {
    return (
        <div className="glass-panel p-4 md:p-6 w-full min-w-0">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Recent Transactions</h3>
                <Link href="/cashbook" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>

            <div className="space-y-2">
                {dataLoading ? (
                    <SkeletonTransactionList count={5} />
                ) : recentTransactions.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center text-gray-400 opacity-80 animate-in fade-in duration-500">
                        <Coffee size={40} className="mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="font-medium text-sm">Quiet money days.</p>
                        <p className="text-xs mt-1">No recorded transactions recently.</p>
                    </div>
                ) : (
                    recentTransactions.map((t, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            key={t.id}
                            className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/40 dark:bg-white/5 border border-transparent hover:border-white/20 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <IndianRupee size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{t.description || 'Untitled Transaction'}</h4>
                                    <p className="text-xs text-gray-500">
                                        {t.date?.toDate ? t.date.toDate().toLocaleDateString() : 'Just now'} • {t.category}
                                    </p>
                                </div>
                            </div>
                            <div className={`font-bold ${t.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {t.type === 'expense' ? '-' : '+'} ₹ {Number(t.amount || 0).toLocaleString('en-IN')}
                            </div>
                        </motion.div>
                    )))}
            </div>
        </div>
    );
}
