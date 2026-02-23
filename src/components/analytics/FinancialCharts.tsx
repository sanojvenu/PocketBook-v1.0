"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMemo, useState } from 'react';

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    tags: string[];
    date: any; // Firestore Timestamp
    category?: string;
    description?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#6366f1'];

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="font-bold text-lg">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999" className="text-sm">
                {`₹${value.toLocaleString()}`}
            </text>
            <Pie
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 10}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                dataKey="value"
            />
            <path d={props.d} stroke={fill} fill="none" />
        </g>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel p-3 shadow-xl bg-white/80 dark:bg-gray-800/80 border border-white/20 backdrop-blur-md rounded-xl">
                <p className="font-bold mb-1 text-gray-700 dark:text-gray-200">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-bold">₹{entry.value.toLocaleString()}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function FinancialCharts({ transactions }: { transactions: Transaction[] }) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const [timeRange, setTimeRange] = useState<'yearly' | 'monthly' | 'weekly' | 'daily'>('monthly');

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(-1);
    };

    const { categoryData, barData } = useMemo(() => {
        // 1. Pie Chart Data (Expenses by Category)
        const expenseMap = new Map<string, number>();

        // 2. Bar Chart Data (Dynamic based on timeRange)
        const barMap = new Map<string, { income: number, expense: number, date: number }>();

        transactions.forEach(t => {
            const amt = Number(t.amount) || 0;
            const type = t.type || 'expense';
            const cat = t.category || 'Other';

            // Pie Data (Always All Time or filtered by generic date range? 
            // Usually Pie Chart follows the same filter, but properly it should probably be separate or follow the global filter.
            // For now, let's keep Pie Chart as "All Time" or "Recent" as per original code which didn't filter strictly except for the 6 month init loop.
            // Actually, the original code initialized 6 months but then iterated ALL transactions. 
            // If the transaction date matched the map, it added it. If not, it ignored it for Bar Chart.
            // For Pie Chart, it aggregated EVERYTHING.
            // We will stick to that logic: Pie = All Expenses, Bar = Time Range specific.

            if (type === 'expense') {
                expenseMap.set(cat, (expenseMap.get(cat) || 0) + amt);
            }

            // Bar Data
            let dateObj: Date | null = null;
            if (t.date?.toDate) dateObj = t.date.toDate();
            else if (typeof t.date === 'string') dateObj = new Date(t.date);

            if (dateObj) {
                let key = '';
                let sortValue = 0;

                if (timeRange === 'yearly') {
                    key = dateObj.getFullYear().toString();
                    sortValue = dateObj.getFullYear();
                } else if (timeRange === 'monthly') {
                    key = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
                    sortValue = dateObj.getFullYear() * 100 + dateObj.getMonth();
                } else if (timeRange === 'weekly') {
                    const d = new Date(dateObj);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                    const weekStart = new Date(d.setDate(diff));
                    key = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
                    sortValue = weekStart.getTime();
                } else if (timeRange === 'daily') {
                    key = dateObj.toLocaleString('default', { day: 'numeric', month: 'short' });
                    sortValue = dateObj.getTime();
                }

                if (!barMap.has(key)) {
                    barMap.set(key, { income: 0, expense: 0, date: sortValue });
                }

                const entry = barMap.get(key)!;
                if (type === 'income') entry.income += amt;
                else entry.expense += amt;
            }
        });

        const pieData = Array.from(expenseMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 7);

        // Sort Bar Data
        const sortedBarData = Array.from(barMap.entries())
            .map(([name, val]) => ({
                name,
                income: val.income,
                expense: val.expense,
                sortDate: val.date
            }))
            .sort((a, b) => a.sortDate - b.sortDate);

        // Limit Daily/Weekly to recent if too many? 
        // For simplicity, let's take last 7-12 entries to avoid overcrowding
        const slicedBarData = sortedBarData.slice(-12);

        return { categoryData: pieData, barData: slicedBarData };
    }, [transactions, timeRange]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="glass-panel p-4 md:p-6 w-full min-w-0">
                <h3 className="text-xl font-bold mb-4">Expense Breakdown</h3>
                <div className="h-[250px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart style={{ outline: 'none' }} onMouseLeave={onPieLeave}>
                            <Pie
                                {...({ activeIndex, activeShape: renderActiveShape } as any)}
                                onMouseEnter={onPieEnter}
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                fill="#8884d8"
                                dataKey="value"
                                paddingAngle={2}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke={activeIndex === index ? 'rgba(255,255,255,0.8)' : 'transparent'}
                                        strokeWidth={activeIndex === index ? 3 : 0}
                                        fillOpacity={activeIndex === -1 || activeIndex === index ? 1 : 0.4}
                                        style={{
                                            filter: activeIndex === index ? 'drop-shadow(0px 0px 6px rgba(0,0,0,0.2)) brightness(1.2)' : 'none',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel p-4 md:p-6 w-full min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h3 className="text-xl font-bold">Trends</h3>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        {(['yearly', 'monthly', 'weekly', 'daily'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === r
                                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-[250px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            style={{ outline: "none" }}
                            data={barData}
                            margin={{
                                top: 5,
                                right: 10,
                                left: 0,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 4 }} />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
