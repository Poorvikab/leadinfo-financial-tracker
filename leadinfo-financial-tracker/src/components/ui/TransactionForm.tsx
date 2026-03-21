import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, DollarSign, FileText, Tag, ArrowLeftRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { Transaction } from '@/context/TransactionContext';

const INCOME_CATEGORY_OPTIONS = [
  { label: "Gross Sales", tax_line: "Line 1a", tax_category: "Income" },
  { label: "Sales Credit", tax_line: "Line 1a", tax_category: "Income" },
  { label: "Salary Income", tax_line: "Line 1a", tax_category: "Income" },
];

const EXPENSE_CATEGORY_OPTIONS = [
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
];

export const ALL_CATEGORY_OPTIONS = [...INCOME_CATEGORY_OPTIONS, ...EXPENSE_CATEGORY_OPTIONS];

const selectStyles = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 12px center',
  paddingLeft: '37px',
  paddingRight: '32px',
};

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  initialData?: Transaction | null;
  onCancelEdit?: () => void;
}

export default function TransactionForm({ onSubmit, initialData, onCancelEdit }: TransactionFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [taxLine, setTaxLine] = useState<string | null>(null);
  const [taxCategory, setTaxCategory] = useState<string | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const categoryOptions = formType === 'income' ? INCOME_CATEGORY_OPTIONS : EXPENSE_CATEGORY_OPTIONS;
  const isEditing = !!initialData;

  // Close type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialData) {
      const [y, m, d] = initialData.date.split("-");
      setDate(new Date(Number(y), Number(m) - 1, Number(d)));
      setFormType(initialData.type === 'income' ? 'income' : 'expense');
      setCategory(initialData.category);
      setAmount(initialData.amount.toString());
      setNotes(initialData.notes);
      setTaxLine(initialData.tax_line || null);
      setTaxCategory(initialData.tax_category || null);
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setDate(new Date());
    setCategory('');
    setAmount('');
    setNotes('');
    setTaxLine(null);
    setTaxCategory(null);
  };

  const handleTypeSelect = (type: 'income' | 'expense') => {
    setFormType(type);
    setTypeDropdownOpen(false);
    setCategory('');
    setTaxLine(null);
    setTaxCategory(null);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    if (val) {
      const option = categoryOptions.find(opt => opt.label === val);
      if (option) { setTaxLine(option.tax_line); setTaxCategory(option.tax_category); }
    } else {
      setTaxLine(null); setTaxCategory(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;

    const selected = categoryOptions.find(c => c.label.toLowerCase() === category.toLowerCase());
    let tax_line = selected?.tax_line ?? null;
    let tax_category = selected?.tax_category ?? null;
    let record_subtype = "standard";
    const is_credit = formType === 'income';

    if (category === "Renovation") {
      if (numericAmount < 5000) { tax_line = "Line 9"; tax_category = "Repairs & Maintenance"; record_subtype = "repair"; }
      else { tax_line = "Line 14"; tax_category = "Depreciation"; record_subtype = "capital"; }
    }
    if (category === "Car") { tax_line = "Line 12"; tax_category = "Vehicle"; record_subtype = "vehicle"; }

    onSubmit({ date: format(date, 'yyyy-MM-dd'), category, amount: numericAmount, notes, type: formType, tax_line, tax_category, record_subtype, is_credit });
    if (!initialData) resetForm();
  };

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] h-fit sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg text-[var(--color-text-primary)]">
          {isEditing ? 'Edit Entry' : 'Add New Entry'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-[var(--color-text-secondary)]">Date</Label>
            <CustomDatePicker selectedDate={date} onChange={setDate} />
          </div>

          {/* ✅ Type — custom dropdown with colored options */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]">Type</Label>
            <div ref={typeDropdownRef} className="relative">
              {/* Trigger button */}
              <button
                type="button"
                disabled={isEditing}
                onClick={() => !isEditing && setTypeDropdownOpen(prev => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md border bg-[var(--color-background)] border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors ${isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--color-primary)]'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-[var(--color-text-secondary)]" />
                  <span className={`text-sm font-medium ${formType === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {formType === 'income' ? '+ Income' : '− Expense'}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ✅ Custom dropdown — full control over option colors */}
              {typeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] shadow-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('income')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors hover:bg-green-500/10 ${formType === 'income' ? 'bg-green-500/10' : ''
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <span className="text-green-400 font-medium">+ Income</span>
                  </button>
                  <div className="border-t border-[var(--color-border)]" />
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('expense')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors hover:bg-red-500/10 ${formType === 'expense' ? 'bg-red-500/10' : ''
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-red-400 font-medium">− Expense</span>
                  </button>
                </div>
              )}
            </div>
            {isEditing && (
              <p className="text-xs text-[var(--color-text-secondary)] opacity-60">Type is locked while editing</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-[var(--color-text-secondary)]">Category</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)] pointer-events-none" />
              <select
                id="category"
                className="bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-md w-full py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] appearance-none"
                style={selectStyles}
                value={category}
                onChange={handleCategoryChange}
              >
                <option value="">Select a category...</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[var(--color-text-secondary)]">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[var(--color-text-secondary)]">Notes</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
              <Input
                id="notes"
                placeholder="Optional notes"
                className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]"
                onClick={onCancelEdit}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              {isEditing ? 'Update Data' : <><Plus className="mr-2 h-4 w-4" /> Add Data</>}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}