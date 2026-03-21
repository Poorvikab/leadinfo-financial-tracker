import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, FileText, Filter } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { useTransactions } from '@/context/TransactionContext';
import { format, eachMonthOfInterval } from 'date-fns';

const COLORS = ['#A3FF3F', '#22D3EE', '#EF4444', '#A855F7', '#F59E0B', '#10B981'];

const TAX_LINE_ORDER = [
  { line: 'Line 1a', label: 'Gross Receipts / Sales', section: 'income' },
  { line: 'Line 7', label: 'Compensation of Officers', section: 'expense' },
  { line: 'Line 9', label: 'Repairs & Maintenance', section: 'expense' },
  { line: 'Line 12', label: 'Taxes & License (Vehicle)', section: 'expense' },
  { line: 'Line 14', label: 'Depreciation', section: 'expense' },
  { line: 'Line 16', label: 'Advertising', section: 'expense' },
  { line: 'Line 17', label: 'Pension / 401k Employer', section: 'expense' },
  { line: 'Line 19', label: 'Utilities & Communications', section: 'expense' },
  { line: 'Line 20', label: 'Other Deductions', section: 'expense' },
  { line: 'Line 24a', label: 'Advance / Estimated Taxes', section: 'expense' },
  { line: 'W-2 Box 12', label: '401k Employee Contribution', section: 'expense' },
  { line: 'Form 1125-A Line 3', label: 'Cost of Labor (COGS)', section: 'expense' },
  { line: 'Form 1125-A Line 5', label: 'Shipping & Handling (COGS)', section: 'expense' },
  { line: 'Form 1125-A Line 7', label: 'Inventory (COGS)', section: 'expense' },
];

const tooltipStyle = {
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text-primary)',
  borderRadius: '8px',
  fontSize: '12px',
};

export default function ReportsView() {
  const { transactions } = useTransactions();

  // ✅ Free-entry year — user types any valid year
  const [yearInput, setYearInput] = useState<string>(String(new Date().getFullYear()));
  const selectedYear = parseInt(yearInput) || new Date().getFullYear();

  const hasData = transactions.length > 0;

  const yearTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(String(selectedYear))),
    [transactions, selectedYear]
  );

  // 1. Monthly data
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31),
    });
    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const mt = yearTransactions.filter(t => t.date.startsWith(monthStr));
      const income = mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { name: format(month, 'MMM'), income, expenses, profit: income - expenses };
    });
  }, [yearTransactions, selectedYear]);

  // 2. Expense distribution
  const expenseDistData = useMemo(() => {
    const map = new Map<string, number>();
    yearTransactions.filter(t => t.type === 'expense').forEach(t =>
      map.set(t.category, (map.get(t.category) || 0) + t.amount)
    );
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [yearTransactions]);

  // 3. Schedule C
  const scheduleCData = useMemo(() => {
    const lineMap = new Map<string, { total: number; categories: string[] }>();
    yearTransactions.forEach(t => {
      if (!t.tax_line) return;
      const e = lineMap.get(t.tax_line) || { total: 0, categories: [] };
      e.total += t.amount;
      if (!e.categories.includes(t.category)) e.categories.push(t.category);
      lineMap.set(t.tax_line, e);
    });
    return TAX_LINE_ORDER
      .filter(def => lineMap.has(def.line))
      .map(def => ({
        ...def,
        total: lineMap.get(def.line)!.total,
        categories: lineMap.get(def.line)!.categories.join(', '),
      }));
  }, [yearTransactions]);

  const totalIncome = scheduleCData.filter(r => r.section === 'income').reduce((s, r) => s + r.total, 0);
  const totalExpenses = scheduleCData.filter(r => r.section === 'expense').reduce((s, r) => s + r.total, 0);
  const netProfit = totalIncome - totalExpenses;

  if (!hasData) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Financial Reports</h2>
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[var(--color-surface-highlight)] rounded-full flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-[var(--color-text-secondary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">No Reports Available</h3>
            <p className="text-[var(--color-text-secondary)] max-w-md">
              Financial reports will appear once income or expense records are added.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header + Year Filter ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Financial Reports</h2>

        {/* ✅ Free-entry year input — styled to match dashboard filter */}
        <div className="flex items-center gap-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 hover:border-[var(--color-primary)] focus-within:border-[var(--color-primary)] transition-colors">
          <Filter className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
          <input
            type="number"
            min="1900"
            max="2100"
            value={yearInput}
            onChange={e => setYearInput(e.target.value)}
            className="bg-transparent border-none text-[var(--color-text-primary)] text-sm focus:outline-none w-16 text-center"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* ── Schedule C ───────────────────────────────────────────────────── */}
      <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-text-primary)] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--color-primary)]" />
            Schedule C — Tax Line Summary
            <span className="ml-1 text-xs font-normal text-[var(--color-text-secondary)] opacity-60">FY {selectedYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleCData.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm">
              No tax line data for {selectedYear}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">Tax Line</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Categories Included</th>
                    <th className="px-6 py-3 text-right whitespace-nowrap">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {scheduleCData.filter(r => r.section === 'income').length > 0 && (
                    <tr className="bg-green-500/5">
                      <td colSpan={4} className="px-6 py-2 text-xs font-semibold text-green-400 uppercase tracking-wider">Income</td>
                    </tr>
                  )}
                  {scheduleCData.filter(r => r.section === 'income').map(row => (
                    <tr key={row.line} className="hover:bg-[var(--color-surface-highlight)] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400 font-mono">{row.line}</span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-primary)] font-medium">{row.label}</td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs">{row.categories}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-400">+${row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  {scheduleCData.filter(r => r.section === 'expense').length > 0 && (
                    <tr className="bg-red-500/5">
                      <td colSpan={4} className="px-6 py-2 text-xs font-semibold text-red-400 uppercase tracking-wider">Deductions / Expenses</td>
                    </tr>
                  )}
                  {scheduleCData.filter(r => r.section === 'expense').map(row => (
                    <tr key={row.line} className="hover:bg-[var(--color-surface-highlight)] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400 font-mono">{row.line}</span>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-primary)] font-medium">{row.label}</td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs">{row.categories}</td>
                      <td className="px-6 py-4 text-right font-medium text-red-400">-${row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-[var(--color-surface-highlight)] font-semibold">
                    <td colSpan={3} className="px-6 py-4 text-[var(--color-text-primary)]">Net Profit / Loss</td>
                    <td className={`px-6 py-4 text-right text-base font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {netProfit >= 0 ? '+' : '-'}${Math.abs(netProfit).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-primary)]" />
              Profit Trend ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="profit" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: 'var(--color-primary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--color-secondary)]" />
              Income vs Expenses ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="income" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Breakdown + Pie ───────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)]">
              Monthly Financial Breakdown — {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-[var(--color-text-secondary)]">
                <thead className="text-xs uppercase bg-[var(--color-surface-highlight)]">
                  <tr>
                    <th className="px-6 py-3 rounded-l-lg">Month</th>
                    <th className="px-6 py-3">Total Income</th>
                    <th className="px-6 py-3">Total Expenses</th>
                    <th className="px-6 py-3 rounded-r-lg">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {monthlyData.map((item, i) => (
                    <tr key={i} className="hover:bg-[var(--color-surface-highlight)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">{item.name}</td>
                      <td className="px-6 py-4 text-[var(--color-primary)]">${item.income.toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-500">${item.expenses.toLocaleString()}</td>
                      <td className={`px-6 py-4 font-medium ${item.profit >= 0 ? 'text-[var(--color-text-primary)]' : 'text-red-500'}`}>
                        ${item.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text-primary)] flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-purple-500" />
              Expense Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {expenseDistData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseDistData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {expenseDistData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)] text-sm">
                  No expense data for {selectedYear}.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}