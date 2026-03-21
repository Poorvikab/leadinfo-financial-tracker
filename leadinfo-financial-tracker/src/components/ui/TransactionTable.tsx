import React, { useState, useMemo } from 'react';
import { Transaction } from '@/context/TransactionContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { parseExcelDate } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export const CATEGORY_OPTIONS = [
  { label: "Phone", tax_line: "Line 19", tax_category: "Utilities" },
  { label: "Internet", tax_line: "Line 19", tax_category: "Utilities" },
  { label: "Electricity", tax_line: "Line 19", tax_category: "Utilities" },
  { label: "Water", tax_line: "Line 19", tax_category: "Utilities" },
  { label: "Trash", tax_line: "Line 19", tax_category: "Utilities" },
  { label: "Parking", tax_line: "Line 19", tax_category: "Utilities" },
  { label: "Marketing", tax_line: "Line 16", tax_category: "Advertising" },
  { label: "Sponsorship", tax_line: "Line 16", tax_category: "Advertising" },
  { label: "Repairs", tax_line: "Line 9", tax_category: "Repairs & Maintenance" },
  { label: "Maintenance", tax_line: "Line 9", tax_category: "Repairs & Maintenance" },
  { label: "Renovation", tax_line: "Line 9", tax_category: "Repairs & Maintenance" },
  { label: "Yard Work", tax_line: "Line 9", tax_category: "Repairs & Maintenance" },
  { label: "Snow Removal", tax_line: "Line 9", tax_category: "Repairs & Maintenance" },
  { label: "Car", tax_line: "Line 12", tax_category: "Vehicle" },
  { label: "Sales Tax", tax_line: "Line 12", tax_category: "Taxes & License" },
  { label: "Depreciation", tax_line: "Line 14", tax_category: "Depreciation" },
  { label: "Major Renovation", tax_line: "Line 14", tax_category: "Depreciation" },
  { label: "Salary", tax_line: "Line 7", tax_category: "Salary" },
  { label: "Officer Salary", tax_line: "Line 7", tax_category: "Salary" },
  { label: "Bank Fees", tax_line: "Line 20", tax_category: "Other" },
  { label: "Payment Fees", tax_line: "Line 20", tax_category: "Other" },
  { label: "Payroll Service Fees", tax_line: "Line 20", tax_category: "Other" },
  { label: "401k Employer Contribution", tax_line: "Line 17", tax_category: "Retirement" },
  { label: "401k Employee Contribution", tax_line: "W-2 Box 12", tax_category: "Retirement" },
  { label: "Advance Taxes", tax_line: "Line 24a", tax_category: "Taxes" },
  { label: "Estimated Taxes", tax_line: "Line 24a", tax_category: "Taxes" },
  { label: "Inventory", tax_line: "Form 1125-A Line 7", tax_category: "COGS" },
  { label: "Labor (COGS)", tax_line: "Form 1125-A Line 3", tax_category: "COGS" },
  { label: "Shipping", tax_line: "Form 1125-A Line 5", tax_category: "COGS" },
  { label: "Gross Sales", tax_line: "Line 1a", tax_category: "Income" },
  { label: "Sales Credit", tax_line: "Line 1a", tax_category: "Income" },
  { label: "Salary Income", tax_line: "Line 1a", tax_category: "Income" },
];

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void | Promise<void>;
  onEdit?: (transaction: Transaction) => void;
  onImport?: (data: Omit<Transaction, 'id' | 'createdAt'>[]) => void | Promise<void>;
  onDeleteSelected?: (ids: string[]) => void | Promise<void>;
  title?: string;
  defaultRecordType?: Transaction['type'];
}

export default function TransactionTable({
  transactions,
  onDelete,
  onEdit,
  onImport,
  onDeleteSelected,
  title = 'Recent Transactions',
  defaultRecordType = 'expense',
}: TransactionTableProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // ✅ Default sort is descending (newest first)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(t =>
      t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.amount.toString().includes(searchQuery) ||
      t.date.includes(searchQuery)
    );

    // ✅ desc = newest first (default), asc = oldest first
    return sortOrder === 'desc'
      ? filtered.slice().sort((a, b) => b.date.localeCompare(a.date))
      : filtered.slice().sort((a, b) => a.date.localeCompare(b.date));

  }, [transactions, searchQuery, sortOrder]);

  const allVisibleSelected =
    filteredTransactions.length > 0 &&
    filteredTransactions.every((t) => selectedIds.has(t.id));

  const toggleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      filteredTransactions.forEach((t) => next.delete(t.id));
    } else {
      filteredTransactions.forEach((t) => next.add(t.id));
    }
    setSelectedIds(next);
  };

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteSelectedClick = () => {
    if (!onDeleteSelected) return;
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    void onDeleteSelected(ids);
    setSelectedIds(new Set());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];

      const importedTransactions = rows
        .filter((row) => Array.isArray(row) && row.length >= 4)
        .map((row) => {
          const [rawDate, rawCategory, rawNotes, rawAmount] = row;
          const match = CATEGORY_OPTIONS.find(
            (opt) => opt.label.toLowerCase() === String(rawCategory || "").toLowerCase()
          );
          const recordType = defaultRecordType;
          return {
            date: parseExcelDate(rawDate) || new Date().toISOString().split('T')[0],
            category: rawCategory || "",
            notes: rawNotes || "",
            amount: Number(rawAmount) || 0,
            type: recordType,
            tax_line: match?.tax_line ?? null,
            tax_category: match?.tax_category ?? null,
            record_subtype: "imported",
            is_credit: recordType === 'income',
          };
        });

      onImport && void onImport(importedTransactions);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
            <Input
              placeholder="Search records..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {onImport && (
            <div className="relative">
              <input type="file" accept=".xlsx,.csv" className="absolute inset-0 opacity-0" onChange={handleFileUpload} />
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import</Button>
            </div>
          )}

          <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'desc' ? <ArrowDown className="mr-2 h-4 w-4" /> : <ArrowUp className="mr-2 h-4 w-4" />}
            Sort
          </Button>

          {onDeleteSelected && (
            <Button variant="outline" disabled={!selectedIds.size} onClick={handleDeleteSelectedClick}>
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
          <table className="min-w-[1200px] w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]">
              <tr>
                {onDeleteSelected && (
                  <th className="px-4 py-4 w-10">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAllVisible} />
                  </th>
                )}
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Tax Line</th>
                <th className="px-6 py-4">Tax Category</th>
                <th className="px-6 py-4">Subtype</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Credit</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--color-surface-highlight)] group">

                    {onDeleteSelected && (
                      <td className="px-4 py-4">
                        <Checkbox checked={selectedIds.has(t.id)} onCheckedChange={() => toggleRow(t.id)} />
                      </td>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>

                    {/* Category badge */}
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        t.type === 'income'
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      )}>
                        {t.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                      {String(t.tax_line)}
                    </td>

                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                      {String(t.tax_category)}
                    </td>

                    <td className="px-6 py-4 text-xs opacity-70">
                      {String(t.record_subtype)}
                    </td>

                    {/* ✅ Type badge — green border for income, red border for expense */}
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        t.type === 'income'
                          ? "bg-green-500/10 text-green-400 border-green-500/40"
                          : "bg-red-500/10 text-red-400 border-red-500/40"
                      )}>
                        {t.type}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        t.is_credit
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      )}>
                        {t.is_credit ? "True" : "False"}
                      </span>
                    </td>

                    <td className="px-6 py-4 max-w-[200px] truncate">{t.notes}</td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                        {onEdit && (
                          <button onClick={(e) => { e.stopPropagation(); onEdit(t); }}>
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={onDeleteSelected ? 11 : 10} className="text-center py-12">
                    No records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}