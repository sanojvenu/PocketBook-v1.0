import { PartyPopper } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SkeletonTransactionList } from "@/components/ui/Skeleton";
import { SwipeableList } from 'react-swipeable-list';
import SwipeableReminderItem from "@/components/SwipeableReminderItem";
import { Reminder } from "@/types";

interface DashboardRemindersProps {
    upcomingReminders: Reminder[];
    dataLoading: boolean;
    isNative: boolean;
    handleCompleteReminderClick: (reminder: any) => void;
    handleEditReminder: (reminder: Reminder) => void;
    getDaysDue: (date: string) => string;
}

export default function DashboardReminders({
    upcomingReminders,
    dataLoading,
    isNative,
    handleCompleteReminderClick,
    handleEditReminder,
    getDaysDue
}: DashboardRemindersProps) {
    return (
        <div className="glass-panel p-4 md:p-6 w-full min-w-0">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Upcoming Reminders</h3>
                <Link href="/reminders" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>

            <div className="space-y-2">
                {dataLoading ? (
                    <SkeletonTransactionList count={3} />
                ) : upcomingReminders.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center text-gray-400 opacity-80 animate-in fade-in duration-500">
                        <PartyPopper size={40} className="mb-3 text-emerald-200 dark:text-emerald-900" />
                        <p className="font-medium text-sm">All caught up!</p>
                        <p className="text-xs mt-1">Enjoy your day. No pending reminders.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="space-y-1">
                            {isNative ? (
                                <SwipeableList>
                                    {upcomingReminders.map((r, index) => (
                                        <SwipeableReminderItem
                                            key={r.id}
                                            reminder={r}
                                            onComplete={handleCompleteReminderClick}
                                            onEdit={handleEditReminder}
                                            getDaysDue={getDaysDue}
                                            swipeEnabled={true}
                                        />
                                    ))}
                                </SwipeableList>
                            ) : (
                                <div className="space-y-2">
                                    {upcomingReminders.map((r, index) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            key={r.id}
                                        >
                                            <SwipeableReminderItem
                                                reminder={r}
                                                onComplete={handleCompleteReminderClick}
                                                onEdit={handleEditReminder}
                                                getDaysDue={getDaysDue}
                                                swipeEnabled={false}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            {isNative && <p className="text-center text-xs text-gray-400 mt-2">Swipe left to complete or right to edit</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
