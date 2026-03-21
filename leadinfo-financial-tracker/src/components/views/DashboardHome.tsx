import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  PiggyBank, 
  Filter
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  isWithinInterval, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear
} from 'date-fns';
import { useTransactions } from '@/context/TransactionContext';
import TransactionTable from '@/components/ui/TransactionTable';

// Types
type FilterType = 'monthly' | 'quarterly' | 'yearly';

const COLORS = ['#A3FF3F', '#22D3EE', '#EF4444', '#A855F7'];

export default function DashboardHome({ onNavigate }: { onNavigate: (view: string) => void }) {
  // State
  const { transactions } = useTransactions();
  const [filterType, setFilterType] = useState<FilterType>('monthly');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Derived Data (Filtering)
  const filteredTransactions = useMemo(() => {
    const date = parseISO(selectedDate);
    let start, end;

    switch (filterType) {
      case 'monthly':
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
      case 'quarterly':
        start = startOfQuarter(date);
        end = endOfQuarter(date);
        break;
      case 'yearly':
        start = startOfYear(date);
        end = endOfYear(date);
        break;
      default:
        start = startOfMonth(date);
        end = endOfMonth(date);
    }

    return transactions
      .filter(t => {
        const tDate = parseISO(t.date);
        return isWithinInterval(tDate, { start, end });
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, selectedDate]);

  // Calculate Stats
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return { income, expenses, netProfit, savingsRate };
  }, [filteredTransactions]);

  // Chart Data
  const chartData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const dataMap = new Map();

    filteredTransactions.forEach(t => {
      const dateKey = filterType === 'yearly' 
        ? format(parseISO(t.date), 'MMM') 
        : format(parseISO(t.date), 'dd MMM');
      
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, { name: dateKey, income: 0, expense: 0 });
      }

      const entry = dataMap.get(dateKey);
      if (t.type === 'income') entry.income += t.amount;
      if (t.type === 'expense') entry.expense += t.amount;
    });

    return Array.from(dataMap.values()).reverse();
  }, [filteredTransactions, filterType]);

  const pieChartData = useMemo(() => {
    if (stats.income === 0 && stats.expenses === 0) return [];
    return [
      { name: 'Income', value: stats.income },
      { name: 'Expenses', value: stats.expenses },
    ];
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Financial Overview</h2>
          <p className="text-[var(--color-text-secondary)]">Track your financial health and performance</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)]">
          <button 
            onClick={() => setFilterType('monthly')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${filterType === 'monthly' ? 'bg-[var(--color-primary)] text-black font-medium shadow-[0_0_10px_rgba(163,255,63,0.3)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setFilterType('quarterly')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${filterType === 'quarterly' ? 'bg-[var(--color-primary)] text-black font-medium shadow-[0_0_10px_rgba(163,255,63,0.3)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]'}`}
          >
            Quarterly
          </button>
          <button 
            onClick={() => setFilterType('yearly')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${filterType === 'yearly' ? 'bg-[var(--color-primary)] text-black font-medium shadow-[0_0_10px_rgba(163,255,63,0.3)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]'}`}
          >
            Yearly
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 hover:border-[var(--color-primary)] transition-colors">
          <Filter className="h-4 w-4 text-[var(--color-primary)]" />
          <input 
            type={filterType === 'yearly' ? "number" : filterType === 'monthly' ? "month" : "date"}
            className="bg-transparent border-none text-[var(--color-text-primary)] text-sm focus:outline-none w-full"
            style={{ colorScheme: 'dark' }}
            value={filterType === 'yearly' ? selectedDate.split('-')[0] : filterType === 'monthly' ? selectedDate.slice(0, 7) : selectedDate}
            onChange={(e) => {
              if (filterType === 'yearly') setSelectedDate(`${e.target.value}-01-01`);
              else if (filterType === 'monthly') setSelectedDate(`${e.target.value}-01`);
              else setSelectedDate(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-[var(--color-primary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">${stats.income.toLocaleString()}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              +0.0% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-[var(--color-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">${stats.expenses.toLocaleString()}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              -0.0% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">${stats.netProfit.toLocaleString()}</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              +0.0% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.savingsRate.toFixed(1)}%</div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              of gross income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--color-text-secondary)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="var(--color-text-secondary)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-surface)', 
                        borderColor: 'var(--color-border)', 
                        color: 'var(--color-text-primary)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: 'var(--color-text-primary)', padding: 0 }}
                      labelStyle={{ marginBottom: '4px', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="var(--color-primary)" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="var(--color-secondary)" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-[var(--color-text-secondary)] text-sm">
                  No financial records available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-surface)', 
                        borderColor: 'var(--color-border)', 
                        color: 'var(--color-text-primary)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: 'var(--color-text-primary)', padding: 0 }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-[var(--color-text-secondary)] text-sm">
                  No financial records available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table (Read Only / Quick View) */}
      <TransactionTable 
        transactions={filteredTransactions.slice(0, 5)} 
        title="Recent Activity"
      />
    </div>
  );
}
