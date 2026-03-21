import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, FileText, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import type { RetirementRecordFormData } from '@/components/ui/RetirementForm';
import { RETIREMENT_TAX_MAP } from '@/components/ui/RetirementForm';
import { Checkbox } from '@/components/ui/checkbox';

export interface RetirementRecord extends RetirementRecordFormData {
  id: string;
  created_at: string;
}

interface RetirementTableProps {
  records: RetirementRecord[];
  onDelete?: (id: string) => void | Promise<void>;
  onEdit?: (record: RetirementRecord) => void;
  onImport?: (rows: RetirementRecordFormData[]) => void | Promise<void>;
  onDeleteSelected?: (ids: string[]) => void | Promise<void>;
  title?: string;
}

export default function RetirementTable({
  records,
  onDelete,
  onEdit,
  onImport,
  onDeleteSelected,
  title = 'Contribution History',
}: RetirementTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredRecords = useMemo(() => {
    const filtered = records.filter((r) => {
      const query = searchQuery.toLowerCase();
      return (
        r.employee_name.toLowerCase().includes(query) ||
        r.notes.toLowerCase().includes(query) ||
        r.contribution_date.includes(searchQuery)
      );
    });

    return sortOrder === 'desc'
      ? filtered.slice().sort((a, b) => b.contribution_date.localeCompare(a.contribution_date))
      : filtered.slice().sort((a, b) => a.contribution_date.localeCompare(b.contribution_date));
  }, [records, searchQuery, sortOrder]);

  const allVisibleSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.has(r.id));

  const toggleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      filteredRecords.forEach((r) => next.delete(r.id));
    } else {
      filteredRecords.forEach((r) => next.add(r.id));
    }
    setSelectedIds(next);
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
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
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr as string, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      const imported: RetirementRecordFormData[] = (data as any[]).map((row) => ({
        employee_name: row['Employee Name'] || row.employee_name || 'Unknown',
        contribution_date: row['Contribution Date'] || row.contribution_date || new Date().toISOString().split('T')[0],
        employee_contribution: Number(row['Employee Contribution'] ?? row.employee_contribution ?? 0),
        employer_contribution: Number(row['Employer Contribution'] ?? row.employer_contribution ?? 0),
        notes: row['Notes'] || row.notes || '',
        employee_tax_line: RETIREMENT_TAX_MAP.employee.tax_line,
        employee_tax_category: RETIREMENT_TAX_MAP.employee.tax_category,
        employer_tax_line: RETIREMENT_TAX_MAP.employer.tax_line,
        employer_tax_category: RETIREMENT_TAX_MAP.employer.tax_category,
      }));

      if (onImport) void onImport(imported);
    };
    reader.readAsBinaryString(file);
  };

  const hasActions = onEdit || onDelete;
  const colSpanCount = (onDeleteSelected ? 1 : 0) + 7 + (hasActions ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
            <Input
              placeholder="Search records..."
              className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {onImport && (
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <Button variant="outline" className="border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]">
                <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />}
            Sort Date
          </Button>

          {onDeleteSelected && (
            <Button
              variant="outline"
              className="border-[var(--color-border)] text-red-400 hover:text-red-300 hover:bg-red-500/10"
              disabled={selectedIds.size === 0}
              onClick={handleDeleteSelectedClick}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
            </Button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]">
              <tr>
                {onDeleteSelected && (
                  <th className="px-4 py-4 font-medium w-10">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAllVisible} aria-label="Select all" />
                  </th>
                )}
                <th className="px-6 py-4 font-medium whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Employee</th>
                {/* ✅ text-left (removed text-right) */}
                <th className="px-6 py-4 font-medium whitespace-nowrap">Employee Contribution</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Employee Tax Line</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Employer Contribution</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Employer Tax Line</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Notes</th>
                {hasActions && <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Actions</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-[var(--color-surface-highlight)] transition-colors group cursor-pointer"
                    onClick={() => onEdit && onEdit(record)}
                  >
                    {onDeleteSelected && (
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={selectedIds.has(record.id)}
                          onCheckedChange={() => toggleRow(record.id)}
                          aria-label="Select row"
                        />
                      </td>
                    )}

                    <td className="px-6 py-4 font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                      {format(parseISO(record.contribution_date), 'MMM dd, yyyy')}
                    </td>

                    <td className="px-6 py-4 text-[var(--color-text-primary)]">
                      {record.employee_name}
                    </td>

                    {/* ✅ text-left (removed text-right) */}
                    <td className="px-6 py-4 font-medium text-[var(--color-primary)]">
                      ${record.employee_contribution.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400">
                        {record.employee_tax_line || RETIREMENT_TAX_MAP.employee.tax_line}
                      </span>
                    </td>

                    {/* ✅ text-left (removed text-right) */}
                    <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]">
                      ${record.employer_contribution.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-400">
                        {record.employer_tax_line || RETIREMENT_TAX_MAP.employer.tax_line}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[var(--color-text-secondary)] max-w-[200px] truncate">
                      {record.notes}
                    </td>

                    {hasActions && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEdit && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); onEdit(record); }}
                              className="p-1.5 hover:bg-[var(--color-background)] rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); void onDelete(record.id); }}
                              className="p-1.5 hover:bg-[var(--color-background)] rounded-md text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={colSpanCount} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--color-text-secondary)]">
                      <div className="w-12 h-12 bg-[var(--color-surface-highlight)] rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 opacity-50" />
                      </div>
                      <p className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
                        No records available yet
                      </p>
                      <p className="text-sm">Add your first 401k entry to populate this table.</p>
                    </div>
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