/**
 * Insights Engine - Financial analysis and smart suggestions
 */

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
    description?: string;
    date: any;
    tags?: string[];
}

interface Budget {
    id: string;
    category: string;
    limit: number;
    period: 'monthly' | 'weekly';
}

interface Insight {
    type: 'warning' | 'success' | 'info' | 'tip';
    title: string;
    message: string;
    value?: number;
    change?: number;
}

// Get date ranges for comparison
const getDateRange = (period: 'thisMonth' | 'lastMonth' | 'thisWeek' | 'lastWeek') => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    if (period === 'thisMonth') {
        const start = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
        const end = new Date(istNow.getFullYear(), istNow.getMonth() + 1, 0);
        return { start, end };
    }
    if (period === 'lastMonth') {
        const start = new Date(istNow.getFullYear(), istNow.getMonth() - 1, 1);
        const end = new Date(istNow.getFullYear(), istNow.getMonth(), 0);
        return { start, end };
    }
    if (period === 'thisWeek') {
        const dayOfWeek = istNow.getDay();
        const start = new Date(istNow);
        start.setDate(istNow.getDate() - dayOfWeek);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
    }
    // lastWeek
    const dayOfWeek = istNow.getDay();
    const start = new Date(istNow);
    start.setDate(istNow.getDate() - dayOfWeek - 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
};

// Filter transactions by date range
const filterByPeriod = (transactions: Transaction[], period: 'thisMonth' | 'lastMonth' | 'thisWeek' | 'lastWeek') => {
    const { start, end } = getDateRange(period);
    return transactions.filter(t => {
        const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return date >= start && date <= end;
    });
};

// Generate financial insights from transactions
export function generateInsights(transactions: Transaction[]): Insight[] {
    const insights: Insight[] = [];

    if (transactions.length < 3) {
        return [{
            type: 'info',
            title: 'Getting Started',
            message: 'Add more transactions to see personalized insights!'
        }];
    }

    const thisMonth = filterByPeriod(transactions, 'thisMonth');
    const lastMonth = filterByPeriod(transactions, 'lastMonth');

    // Calculate totals
    const thisMonthExpense = thisMonth.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const lastMonthExpense = lastMonth.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const thisMonthIncome = thisMonth.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const lastMonthIncome = lastMonth.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);

    // Spending comparison
    if (lastMonthExpense > 0) {
        const change = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
        if (change > 15) {
            insights.push({
                type: 'warning',
                title: 'Spending Up',
                message: `You've spent ${Math.abs(change).toFixed(0)}% more this month compared to last month.`,
                value: thisMonthExpense,
                change
            });
        } else if (change < -10) {
            insights.push({
                type: 'success',
                title: 'Great Savings!',
                message: `You've reduced spending by ${Math.abs(change).toFixed(0)}% compared to last month.`,
                value: thisMonthExpense,
                change
            });
        }
    }

    // Savings rate
    if (thisMonthIncome > 0) {
        const savingsRate = ((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100;
        if (savingsRate >= 20) {
            insights.push({
                type: 'success',
                title: 'Healthy Savings',
                message: `You're saving ${savingsRate.toFixed(0)}% of your income this month!`,
                value: savingsRate
            });
        } else if (savingsRate < 10 && savingsRate >= 0) {
            insights.push({
                type: 'warning',
                title: 'Low Savings',
                message: `Your savings rate is ${savingsRate.toFixed(0)}%. Consider cutting non-essential expenses.`,
                value: savingsRate
            });
        } else if (savingsRate < 0) {
            insights.push({
                type: 'warning',
                title: 'Spending Exceeds Income',
                message: `You've spent ₹${Math.abs(thisMonthIncome - thisMonthExpense).toLocaleString('en-IN')} more than your income!`
            });
        }
    }

    // Top spending category
    const categorySpending: Record<string, number> = {};
    thisMonth.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.category || 'Other';
        categorySpending[cat] = (categorySpending[cat] || 0) + t.amount;
    });

    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && thisMonthExpense > 0) {
        const percentage = (topCategory[1] / thisMonthExpense) * 100;
        if (percentage > 40) {
            insights.push({
                type: 'info',
                title: `${topCategory[0]} Dominates`,
                message: `${topCategory[0]} accounts for ${percentage.toFixed(0)}% of your spending.`,
                value: topCategory[1]
            });
        }
    }

    // Personalized tips
    const tips = [
        'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
        'Review subscriptions monthly to cut unused services.',
        'Set category budgets to stay on track.',
        'Use quick actions to log frequent expenses faster.',
        'Schedule reminders for recurring bills to avoid late fees.'
    ];

    insights.push({
        type: 'tip',
        title: '💡 Tip',
        message: tips[Math.floor(Math.random() * tips.length)]
    });

    return insights;
}

// Smart suggestions based on context
// Smart suggestions based on context
export function getSmartSuggestions(transactions: Transaction[]): string[] {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const hour = istNow.getHours();
    const day = istNow.getDate();
    const dayOfWeek = istNow.getDay(); // 0 = Sunday, 6 = Saturday

    const suggestions: string[] = [];

    // 1. Time-of-day micro-interactions
    if (hour >= 5 && hour < 11) {
        suggestions.push("Log breakfast 🍳");
        suggestions.push("Add commute expense 🚌");
    } else if (hour >= 11 && hour < 15) {
        suggestions.push("Add lunch cost 🍱");
        suggestions.push("Log coffee/tea ☕");
    } else if (hour >= 15 && hour < 19) {
        suggestions.push("Log snacks 🥨");
        suggestions.push("Travel expense 🚕");
    } else if (hour >= 19 && hour < 23) {
        suggestions.push("Log dinner 🍛");
        suggestions.push("Add grocery bill 🥦");
    } else {
        suggestions.push("Late night snack? 🍕");
    }

    // 2. Day-Specific
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        suggestions.push("Weekend spending?");
        suggestions.push("Log movie/outing 🎬");
    } else {
        suggestions.push("Daily total so far");
    }

    // 3. Month-End / Start
    if (day >= 25) {
        suggestions.push("Monthly budget status");
        suggestions.push("Rent/Bills paid? 🧾");
    } else if (day <= 5) {
        suggestions.push("Set this month's budget");
        suggestions.push("Pay Rent 🏠");
    }

    // 4. Pattern-based (High Frequency Categories)
    const categoryCount: Record<string, number> = {};
    transactions.slice(0, 50).forEach(t => {
        if (t.category && t.type === 'expense') {
            categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
        }
    });

    const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

    // Add unique category insights
    if (topCategories.length > 0) {
        suggestions.push(`Spend on ${topCategories[0]}?`);
        if (topCategories[1]) suggestions.push(`${topCategories[1]} breakdown`);
    }

    // 5. Financial Health
    suggestions.push("Show my spending breakdown 📊");
    suggestions.push("How much did I save?");

    // Shuffle and pick 4-5 unique
    const unique = [...new Set(suggestions)];
    return unique.sort(() => 0.5 - Math.random()).slice(0, 5);
}

// Check budget status
export function analyzeBudgetStatus(
    budgets: Budget[],
    transactions: Transaction[]
): { category: string; limit: number; spent: number; percentage: number; status: 'safe' | 'warning' | 'over' }[] {
    const thisMonth = filterByPeriod(transactions, 'thisMonth');

    return budgets.map(budget => {
        const spent = thisMonth
            .filter(t => t.type === 'expense' && t.category?.toLowerCase() === budget.category.toLowerCase())
            .reduce((a, t) => a + t.amount, 0);

        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

        let status: 'safe' | 'warning' | 'over' = 'safe';
        if (percentage >= 100) status = 'over';
        else if (percentage >= 80) status = 'warning';

        return {
            category: budget.category,
            limit: budget.limit,
            spent,
            percentage,
            status
        };
    });
}

// Format currency for display
export function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// detectSubscriptions - Improved
export function detectSubscriptions(transactions: Transaction[]) {
    const groups: Record<string, Transaction[]> = {};

    transactions.filter(t => t.type === 'expense').forEach(t => {
        // Group by EXACT amount and fuzzy description (first 3 words)
        // This avoids grouping "Uber" (variable) but captures "Netflix" (fixed)
        const descWords = (t.description || "").toLowerCase().trim().split(' ').slice(0, 2).join(' ');
        const key = `${descWords}-${t.amount}`; // Composite key

        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    });

    const candidates: { name: string, amount: number, frequency: string, avgGap: number, nextDueDate: string, confidence: number }[] = [];

    Object.entries(groups).forEach(([key, txns]) => {
        if (txns.length < 2) return;

        // Sort by date
        txns.sort((a, b) => {
            const dA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dA.getTime() - dB.getTime();
        });

        // Check intervals
        let totalGap = 0;
        let gaps = 0;
        for (let i = 1; i < txns.length; i++) {
            const d1 = txns[i - 1].date?.toDate ? txns[i - 1].date.toDate() : new Date(txns[i - 1].date);
            const d2 = txns[i].date?.toDate ? txns[i].date.toDate() : new Date(txns[i].date);
            const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 3600 * 24);
            totalGap += diffDays;
            gaps++;
        }

        const avgGap = totalGap / gaps;

        // Match Monthly (28-32 days) or Yearly (360-370 days)
        const isMonthly = avgGap >= 28 && avgGap <= 32;
        const isYearly = avgGap >= 360 && avgGap <= 370;

        if (isMonthly || isYearly) {
            const lastTxn = txns[txns.length - 1];
            const lastDate = lastTxn.date?.toDate ? lastTxn.date.toDate() : new Date(lastTxn.date);
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + Math.round(avgGap));

            // Clean name from composite key
            const name = txns[0].description || "Subscription";

            candidates.push({
                name: name,
                amount: txns[0].amount,
                frequency: isMonthly ? 'Monthly' : 'Yearly',
                avgGap: Math.round(avgGap),
                nextDueDate: nextDate.toISOString().split('T')[0],
                confidence: txns.length > 2 ? 0.9 : 0.7 // Higher confidence if more than 2 occurrences
            });
        }
    });

    return candidates.sort((a, b) => b.confidence - a.confidence);
}

// Trend Analysis
export function analyzeTrends(transactions: Transaction[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Group by Month (last 6 months)
    const monthlyTotals: Record<string, number> = {};

    transactions.forEach(t => {
        if (t.type !== 'expense') return;
        const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + t.amount;
    });

    // Calculate Average (excluding current incomplete month)
    let total = 0;
    let count = 0;
    Object.entries(monthlyTotals).forEach(([key, val]) => {
        const [year, month] = key.split('-').map(Number);
        if (year === currentYear && month === currentMonth) return; // Skip current
        total += val;
        count++;
    });

    const average = count > 0 ? total / count : 0;
    const currentSpending = monthlyTotals[`${currentYear}-${currentMonth}`] || 0;

    return {
        average,
        current: currentSpending,
        status: currentSpending > average ? 'high' : 'low',
        difference: Math.abs(currentSpending - average)
    };
}

export interface SimulationResult {
    canAfford: boolean;
    remainingSavings: number;
    timeToRecover?: number; // Months
    yearlyImpact: number;
    message: string;
}

export function simulateFinancialScenario(
    transactions: Transaction[],
    scenario: { type: 'one_time' | 'recurring', amount: number, title?: string },
    reminders: { amount: number, type: 'pay' | 'collect', completed: boolean }[] = []
): SimulationResult {
    // 1. Calculate Average Monthly Income & Expenses (last 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const recentTxns = transactions.filter(t => {
        const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return d >= threeMonthsAgo;
    });

    const income = recentTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) / 3;
    const expenses = recentTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) / 3;

    // Future Liability from active Reminders (rough estimate per month)
    const pendingReminders = reminders.filter(r => !r.completed);
    const futureMonthlyLiabilities = pendingReminders.filter(r => r.type === 'pay').reduce((sum, r) => sum + r.amount, 0);
    const futureMonthlyExpectedIncome = pendingReminders.filter(r => r.type === 'collect').reduce((sum, r) => sum + r.amount, 0);

    const adjustedMonthlySavingsRate = (income + futureMonthlyExpectedIncome) - (expenses + futureMonthlyLiabilities);

    // 2. Estimate Current Savings (Simplified: Income - Expense over all history)
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const estimatedBalance = totalIncome - totalExpense;

    let canAfford = false;
    let remainingSavings = estimatedBalance;
    let yearlyImpact = 0;
    let message = "";

    if (scenario.type === 'one_time') {
        remainingSavings = estimatedBalance - scenario.amount;
        canAfford = remainingSavings >= 0;
        yearlyImpact = scenario.amount;

        if (canAfford) {
            if (adjustedMonthlySavingsRate > 0) {
                const timeToRecover = Math.ceil(scenario.amount / adjustedMonthlySavingsRate);
                message = `You can afford this! Based on your current run-rate (adjusting for upcoming bills), it will take about ${timeToRecover} month${timeToRecover !== 1 ? 's' : ''} to recover this amount into your savings.`;
            } else {
                message = "You have enough funds now, but your upcoming bills and recent spending indicate a negative cash flow. Recovering this amount might be hard.";
            }
        } else {
            message = `This purchase would put your balance in the negative by ₹${Math.abs(remainingSavings).toLocaleString()}. It's best to save up first.`;
        }
    } else {
        // Recurring
        yearlyImpact = scenario.amount * 12;
        const newSavingsRate = adjustedMonthlySavingsRate - scenario.amount;
        canAfford = newSavingsRate >= 0;
        remainingSavings = estimatedBalance; // Balance doesn't immediately drop

        if (canAfford) {
            message = `You can fit this into your monthly budget. Accounting for upcoming bills, your estimated monthly savings will reduce to roughly ₹${newSavingsRate.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.`;
        } else {
            message = `Careful! This recurring expense exceeds your average monthly savings margin. You'd be overspending by ₹${Math.abs(newSavingsRate).toLocaleString('en-IN', { maximumFractionDigits: 0 })} monthly.`;
        }
    }

    return {
        canAfford,
        remainingSavings,
        yearlyImpact,
        message
    };
}

export interface HealthScore {
    score: number; // 0 to 100
    status: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
    factors: {
        savings: { score: number; impact: number; message: string };
        budget: { score: number; impact: number; message: string };
        bills: { score: number; impact: number; message: string };
    };
}

export function calculateHealthScore(
    transactions: Transaction[],
    budgets: Budget[] = [],
    reminders: { amount: number, completed: boolean, date: string }[] = []
): HealthScore {
    // 1. Savings Factor (Max 40 points)
    const { start, end } = getDateRange('thisMonth');
    const thisMonthTxns = transactions.filter(t => {
        const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return d >= start && d <= end;
    });

    const income = thisMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = thisMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    let savingsScore = 0;
    let savingsMessage = "Not enough income data to calculate savings rate.";

    if (income > 0) {
        const savingsRate = ((income - expenses) / income) * 100;
        if (savingsRate >= 20) {
            savingsScore = 40;
            savingsMessage = "Excellent savings rate (>20%).";
        } else if (savingsRate >= 10) {
            savingsScore = 30;
            savingsMessage = "Good savings rate (10-20%).";
        } else if (savingsRate > 0) {
            savingsScore = 20;
            savingsMessage = "Positive savings, but aiming for 20% is ideal.";
        } else {
            savingsScore = 0;
            savingsMessage = "Spending exceeds income this month.";
        }
    } else if (expenses > 0) {
        savingsScore = 0; // Spending without income logged
        savingsMessage = "Spending recorded with no income yet.";
    } else {
        savingsScore = 20; // Default neutral if no activity
        savingsMessage = "No activity this month yet.";
    }

    // 2. Budget Factor (Max 30 points)
    let budgetScore = 30;
    let budgetMessage = "No budgets set.";
    if (budgets.length > 0) {
        const statuses = analyzeBudgetStatus(budgets, transactions);
        const overBudgets = statuses.filter(s => s.status === 'over').length;
        const warningBudgets = statuses.filter(s => s.status === 'warning').length;

        if (overBudgets > 0) {
            budgetScore -= (overBudgets * 10);
            budgetMessage = `Over budget in ${overBudgets} categor${overBudgets > 1 ? 'ies' : 'y'}.`;
        } else if (warningBudgets > 0) {
            budgetScore -= (warningBudgets * 5);
            budgetMessage = `${warningBudgets} categor${warningBudgets > 1 ? 'ies' : 'y'} nearing limit.`;
        } else {
            budgetMessage = "All budgets are on track.";
        }
        budgetScore = Math.max(0, budgetScore);
    }

    // 3. Bills & Reminders Factor (Max 30 points)
    let billsScore = 30;
    let billsMessage = "No overdue bills.";

    const now = new Date();
    // Normalize now to start of day for accurate overdue checking without timezone weirdness
    now.setHours(0, 0, 0, 0);

    const overdueReminders = reminders.filter(r => {
        if (r.completed) return false;
        const dueDate = new Date(r.date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < now;
    });

    if (overdueReminders.length > 0) {
        billsScore -= (overdueReminders.length * 10);
        billsMessage = `You have ${overdueReminders.length} overdue bill${overdueReminders.length > 1 ? 's' : ''}.`;
        billsScore = Math.max(0, billsScore);
    }

    // Calculate Total
    const totalScore = savingsScore + budgetScore + billsScore;

    let status: HealthScore['status'] = 'Needs Attention';
    if (totalScore >= 80) status = 'Excellent';
    else if (totalScore >= 60) status = 'Good';
    else if (totalScore >= 40) status = 'Fair';

    return {
        score: totalScore,
        status,
        factors: {
            savings: { score: savingsScore, impact: 40, message: savingsMessage },
            budget: { score: budgetScore, impact: 30, message: budgetMessage },
            bills: { score: billsScore, impact: 30, message: billsMessage }
        }
    };
}
