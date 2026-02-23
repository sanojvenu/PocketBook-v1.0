"use client";

import { ArrowUpRight, ArrowDownRight, IndianRupee, TrendingUp, TrendingDown, Plus, Bell, Calendar, CheckCircle2, X, Sparkles, ArrowRight, Coffee, PartyPopper } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import AddTransactionForm from "@/components/AddTransactionForm";
import AddReminderForm from "@/components/AddReminderForm";
import { toast } from "sonner";
import DateFilterDropdown from "@/components/ui/DateFilterDropdown";
import CustomDateModal from "@/components/ui/CustomDateModal";
import FilterDropdown from "@/components/ui/FilterDropdown";

import FinancialCharts from "@/components/analytics/FinancialCharts";
import SmartInsights from "@/components/analytics/SmartInsights";
import { calculateHealthScore } from "@/lib/insightsEngine";
import QuickActions from "@/components/QuickActions";
import { SkeletonDashboard, SkeletonTransactionList } from "@/components/ui/Skeleton";
import { SwipeableList } from 'react-swipeable-list';
import SwipeableReminderItem from "@/components/SwipeableReminderItem";
import { Capacitor } from '@capacitor/core';
import PullToRefresh from "@/components/ui/PullToRefresh";
import { motion } from "framer-motion";
import GlobalFAB from "@/components/ui/GlobalFAB";

import LoginView from "@/components/auth/LoginView";

import { useLocalNotifications } from "@/hooks/useLocalNotifications";
import { Transaction, Reminder } from "@/types";
import { PlusCircle, Search } from "lucide-react";

// NEW DASHBOARD COMPONENTS
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardTransactions from "@/components/dashboard/DashboardTransactions";
import DashboardReminders from "@/components/dashboard/DashboardReminders";

export default function Dashboard() {

  const { user, loading: authLoading } = useAuth();
  const { scheduleNotification, cancelNotification, scheduleWeeklyHealthCheck } = useLocalNotifications();

  // Dashboard State
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Filter State
  const [filterTag, setFilterTag] = useState("All");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [durationLabel, setDurationLabel] = useState("This Month");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  // Modal States
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isTransactionConfirmOpen, setIsTransactionConfirmOpen] = useState(false);
  const [reminderToComplete, setReminderToComplete] = useState<any>(null);

  /* Edit Handler */
  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsReminderModalOpen(true);
  };

  /* Updated Save Handler to support Edit */
  const handleSaveReminder = async (data: { title: string; amount: number; date: string; time?: string; recurrence?: string; type?: 'pay' | 'collect'; tags?: string[] }) => {
    if (!user || !db) return;
    try {
      if (editingReminder) {
        // Update Existing
        const docRef = doc(db, "users", user.uid, "reminders", editingReminder.id);
        await updateDoc(docRef, { ...data });
        // Reschedule notification
        await scheduleNotification({ id: editingReminder.id, ...data });
        toast.success("Reminder updated successfully!");
        setEditingReminder(null);
      } else {
        // Create New
        const docRef = await addDoc(collection(db, "users", user.uid, "reminders"), {
          ...data,
          completed: false,
          userId: user.uid,
          createdAt: new Date()
        });
        // Schedule notification
        await scheduleNotification({ id: docRef.id, ...data });
        toast.success("Reminder added successfully!");
      }
      setIsReminderModalOpen(false);
    } catch (error) {
      console.error("Error saving reminder", error);
      toast.error("Failed to save reminder");
    }
  };

  useEffect(() => {
    if (!user || !db) return;

    // Fetch All Transactions
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setAllTransactions(data);
      setDataLoading(false);
    });

    // Fetch Reminders
    const qReminders = query(
      collection(db, "users", user.uid, "reminders"),
      orderBy("date", "asc")
    );

    const unsubscribeReminders = onSnapshot(qReminders, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reminder[];
      setReminders(data);
      setDataLoading(false);
    });

    return () => {
      unsubscribe();
      unsubscribeReminders();
    };
  }, [user]);

  // Schedule weekly health check when data loads
  useEffect(() => {
    if (allTransactions.length > 0 && reminders.length >= 0) {
      const health = calculateHealthScore(allTransactions, [], reminders); // Provide empty budgets for now if not fetched globally
      scheduleWeeklyHealthCheck(health.score, health.status);
    }
  }, [allTransactions, reminders, scheduleWeeklyHealthCheck]);

  // Memoized Derived Values for performance
  const validTags = useMemo(() => {
    return ["All", ...Array.from(new Set(allTransactions.flatMap(t => t.tags || [])))].sort();
  }, [allTransactions]);

  const filteredData = useMemo(() => {
    return allTransactions.filter(t => {
      // Date Filter
      const dateStr = t.date?.toDate ? t.date.toDate().toISOString().split('T')[0] : "";
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;

      // Tag Filter
      if (filterTag !== 'All' && (!t.tags || !t.tags.includes(filterTag))) return false;

      return true;
    });
  }, [allTransactions, startDate, endDate, filterTag]);

  // Memoized Stats calculation
  const stats = useMemo(() => {
    let bal = 0;
    let inc = 0;
    let exp = 0;

    // Balance calculation respects Tag Filter
    allTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const type = t.type || 'expense';
      const matchesTag = filterTag === 'All' || (t.tags && t.tags.includes(filterTag));

      if (matchesTag) {
        if (type === 'income') bal += amt;
        else bal -= amt;
      }
    });

    // Income/Expense for filtered period
    filteredData.forEach(t => {
      const amt = Number(t.amount) || 0;
      const type = t.type || 'expense';
      if (type === 'income') inc += amt;
      else exp += amt;
    });

    return { balance: bal, income: inc, expense: exp };
  }, [allTransactions, filteredData, filterTag]);

  const recentTransactions = useMemo(() => filteredData.slice(0, 5), [filteredData]);

  const upcomingReminders = useMemo(() => reminders.filter(r => !r.completed).slice(0, 5), [reminders]);

  const getDaysDue = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return "Due Today";
    return `in ${days} days`;
  };

  const handleCompleteReminderClick = (reminder: any) => {
    setReminderToComplete(reminder);
    setIsTransactionConfirmOpen(true);
  };

  const processCompleteReminder = async (reminder: any, createTransaction: boolean) => {
    if (!user || !db) return;
    try {
      // 1. Mark current as completed
      const docRef = doc(db, "users", user.uid, "reminders", reminder.id);
      await updateDoc(docRef, { completed: true });
      await cancelNotification(reminder.id);

      // 1.1 Create Transaction
      if (createTransaction) {
        await addDoc(collection(db, "users", user.uid, "transactions"), {
          description: reminder.title,
          amount: Number(reminder.amount) || 0,
          type: reminder.type === 'collect' ? 'income' : 'expense',
          category: 'Other',
          date: new Date(),
          tags: reminder.tags || ['Reminder'],
          userId: user.uid
        });
      }

      // 2. Recurrence Logic
      if (reminder.recurrence && reminder.recurrence !== 'none') {
        const current = new Date(reminder.date);
        let nextDate = new Date(current);

        switch (reminder.recurrence) {
          case 'daily': nextDate.setDate(current.getDate() + 1); break;
          case 'weekly': nextDate.setDate(current.getDate() + 7); break;
          case 'monthly': nextDate.setMonth(current.getMonth() + 1); break;
          case 'yearly': nextDate.setFullYear(current.getFullYear() + 1); break;
        }

        const nextDateStr = nextDate.toISOString().split('T')[0];
        const newReminderData = {
          title: reminder.title,
          amount: reminder.amount || 0,
          date: nextDateStr,
          recurrence: reminder.recurrence,
          completed: false,
          type: reminder.type || 'pay',
          tags: reminder.tags || [],
          userId: user.uid,
          createdAt: new Date()
        };

        const newDocRef = await addDoc(collection(db, "users", user.uid, "reminders"), newReminderData);
        await scheduleNotification({ id: newDocRef.id, ...newReminderData });

        toast.success(`Completed! Next due: ${nextDate.toLocaleDateString()}`);
      } else {
        toast.success("Reminder completed!");
      }
    } catch (error) {
      console.error("Error completing reminder", error);
      toast.error("Failed to update reminder");
    }
  };

  const handleSaveTransaction = async (data: any) => {
    if (!user || !db) return;
    try {
      let transactionDate = new Date();
      if (data.date) {
        const [y, m, d] = data.date.split('-').map(Number);
        transactionDate = new Date(y, m - 1, d);
      }

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        ...data,
        date: transactionDate,
        userId: user.uid
      });
      toast.success("Transaction added successfully!");
      setIsTransactionModalOpen(false);
    } catch (error) {
      console.error("Error saving transaction", error);
      toast.error("Failed to save transaction");
    }
  };


  // Check Auth First
  if (authLoading) {
    return <SkeletonDashboard />;
  }

  // Loading state with skeleton
  if (dataLoading && user) {
    return <SkeletonDashboard />;
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <PullToRefresh
      disabled={!isNative}
      onRefresh={async () => {
        // Simulate refresh or trigger data re-fetch if needed.
        // Since it's realtime, we just wait a bit to show the animation
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Optional: You could toggle a state to force re-render if needed, but onSnapshot handles data.
        toast.success("Dashboard updated");
      }}>
      <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden pb-4">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold"><span className="text-[#073449]">Pocket</span><span className="text-[#F07E23]">Book</span></h1>
              <p className="text-gray-500 dark:text-gray-400">Smart AI Personal Finance Tracker</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <DateFilterDropdown
                onApply={(start, end, label) => {
                  setStartDate(start);
                  setEndDate(end);
                  setDurationLabel(label);
                }}
                onCustom={() => setIsCustomDateOpen(true)}
                currentLabel={durationLabel}
              />
              <FilterDropdown
                label="Tag"
                value={filterTag}
                onChange={setFilterTag}
                options={validTags.map(t => ({ label: t, value: t }))}
              />
              {/* Clear Filters */}
              {(filterTag !== 'All' || durationLabel !== 'This Month') && (
                <button
                  onClick={() => {
                    const now = new Date();
                    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
                    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
                    setDurationLabel("This Month");
                    setFilterTag("All");
                  }}
                  className="text-red-500 text-xs font-bold flex items-center gap-1 hover:underline ml-auto"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>

        </header>

        {/* AI Trigger Bar (Desktop) */}
        <div className="hidden md:block w-full max-w-2xl mx-auto -mt-2 mb-4">
          <button
            onClick={() => window.dispatchEvent(new Event('open-chat'))}
            className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-2 pl-4 flex items-center gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
          >
            <Sparkles className="text-blue-500 animate-pulse" size={20} />
            <span className="flex-1 text-left text-gray-400 text-sm font-medium">Ask <span className="text-[#073449]">Pocket</span><span className="text-[#F07E23]">Book</span>... (or click to chat)</span>
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 group-hover:scale-105 transition-transform">
              <ArrowRight size={20} />
            </div>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <QuickActions onQuickAdd={handleSaveTransaction} />
        </div>

        <CustomDateModal
          isOpen={isCustomDateOpen}
          onClose={() => setIsCustomDateOpen(false)}
          onApply={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setDurationLabel("Custom");
            setIsCustomDateOpen(false);
          }}
        />

        {/* Summary Cards */}
        <DashboardStats stats={stats} durationLabel={durationLabel} />

        {/* Smart Insights */}
        <SmartInsights transactions={allTransactions} />

        {/* Analytics Charts */}
        <FinancialCharts transactions={allTransactions} />

        {/* Recent Transactions & Upcoming Reminders Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <DashboardTransactions
            recentTransactions={recentTransactions}
            dataLoading={dataLoading}
          />
          <DashboardReminders
            upcomingReminders={upcomingReminders}
            dataLoading={dataLoading}
            isNative={isNative}
            handleCompleteReminderClick={handleCompleteReminderClick}
            handleEditReminder={handleEditReminder}
            getDaysDue={getDaysDue}
          />
        </div>

        <Modal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          title="Add New Transaction"
        >
          <AddTransactionForm
            onSubmit={handleSaveTransaction}
            onCancel={() => setIsTransactionModalOpen(false)}
          />
        </Modal>

        <Modal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setEditingReminder(null);
          }}
          title={editingReminder ? "Edit Reminder" : "Add New Reminder"}
        >
          <AddReminderForm
            onAdd={handleSaveReminder}
            onCancel={() => {
              setIsReminderModalOpen(false);
              setEditingReminder(null);
            }}
            initialData={editingReminder || undefined}
          />
        </Modal>

        <Modal
          isOpen={isTransactionConfirmOpen}
          onClose={() => setIsTransactionConfirmOpen(false)}
          title="Create Transaction?"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Do you want to add a transaction record for this reminder?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={async () => {
                  if (reminderToComplete) {
                    await processCompleteReminder(reminderToComplete, true);
                    setIsTransactionConfirmOpen(false);
                    setReminderToComplete(null);
                  }
                }}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-colors font-bold"
              >
                Yes, Create Transaction
              </button>
              <button
                onClick={async () => {
                  if (reminderToComplete) {
                    await processCompleteReminder(reminderToComplete, false);
                    setIsTransactionConfirmOpen(false);
                    setReminderToComplete(null);
                  }
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                No, Just Mark Complete
              </button>
            </div>
          </div>
        </Modal>

        <GlobalFAB
          onAddTransaction={() => setIsTransactionModalOpen(true)}
          onAddReminder={() => setIsReminderModalOpen(true)}
        />
      </div >
    </PullToRefresh>
  );
}

