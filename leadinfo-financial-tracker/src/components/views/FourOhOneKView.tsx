import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/lib/activityLogger';
import RetirementForm, {
  RetirementRecordFormData,
  RETIREMENT_TAX_MAP,
} from '@/components/ui/RetirementForm';
import RetirementTable, {
  RetirementRecord,
} from '@/components/ui/RetirementTable';
import type { ActivityAction, ActivityRecordType } from '@/context/ActivityContext';

// ✅ Helper to map a raw Supabase row → RetirementRecord (always includes tax fields)
function mapRow(row: any, fallbackCreatedAt?: string): RetirementRecord {
  return {
    id: row.id,
    employee_name: row.employee_name ?? '',
    contribution_date: row.contribution_date,
    employee_contribution: Number(row.employee_contribution) || 0,
    employer_contribution: Number(row.employer_contribution) || 0,
    notes: row.notes ?? '',
    created_at: row.created_at ?? fallbackCreatedAt ?? new Date().toISOString(),
    // ✅ Tax fields — fall back to constants if DB returns null (old records)
    employee_tax_line: row.employee_tax_line ?? RETIREMENT_TAX_MAP.employee.tax_line,
    employee_tax_category: row.employee_tax_category ?? RETIREMENT_TAX_MAP.employee.tax_category,
    employer_tax_line: row.employer_tax_line ?? RETIREMENT_TAX_MAP.employer.tax_line,
    employer_tax_category: row.employer_tax_category ?? RETIREMENT_TAX_MAP.employer.tax_category,
  };
}

// ✅ Helper to build the Supabase payload — always includes tax fields
function buildPayload(data: RetirementRecordFormData) {
  return {
    employee_name: data.employee_name,
    contribution_date: data.contribution_date,
    employee_contribution: data.employee_contribution,
    employer_contribution: data.employer_contribution,
    notes: data.notes,
    employee_tax_line: data.employee_tax_line ?? RETIREMENT_TAX_MAP.employee.tax_line,
    employee_tax_category: data.employee_tax_category ?? RETIREMENT_TAX_MAP.employee.tax_category,
    employer_tax_line: data.employer_tax_line ?? RETIREMENT_TAX_MAP.employer.tax_line,
    employer_tax_category: data.employer_tax_category ?? RETIREMENT_TAX_MAP.employer.tax_category,
  };
}

export default function FourOhOneKView() {
  const [records, setRecords] = useState<RetirementRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<RetirementRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setRecords([]);
      setIsLoading(false);
      setStatus({ type: 'error', message: 'Please log in to perform this action.' });
      return;
    }

    const { data, error } = await supabase
      .from('retirement_401k_records')
      .select('*')
      .order('contribution_date', { ascending: false });

    if (error) {
      console.error('Error fetching 401k records:', error);
      setRecords([]);
      setStatus({ type: 'error', message: 'Failed to load 401k records.' });
    } else {
      // ✅ mapRow handles all fields including tax lines
      setRecords(data?.map((row: any) => mapRow(row)) ?? []);
      setStatus(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const handleSubmit = async (data: RetirementRecordFormData) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus({ type: 'error', message: 'Please log in to perform this action.' });
      return;
    }

    if (editingRecord) {
      const { id } = editingRecord;
      const { error, data: updated } = await supabase
        .from('retirement_401k_records')
        .update(buildPayload(data)) // ✅ includes tax fields
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating 401k record:', error);
        setStatus({ type: 'error', message: 'Failed to update 401k record.' });
        return;
      }

      setRecords((prev) =>
        prev.map((r) => (r.id === id ? mapRow(updated, r.created_at) : r)),
      );
      setEditingRecord(null);
      setStatus({ type: 'success', message: '401k record updated.' });

      const totalContribution = Number(updated.employee_contribution) + Number(updated.employer_contribution) || 0;
      await logActivity('updated', '401k' as ActivityRecordType, totalContribution);

    } else {
      const { data: inserted, error } = await supabase
        .from('retirement_401k_records')
        .insert(buildPayload(data)) // ✅ includes tax fields
        .select()
        .single();

      if (error) {
        console.error('Error inserting 401k record:', error);
        setStatus({ type: 'error', message: 'Failed to add 401k record.' });
        return;
      }

      const mapped = mapRow(inserted);
      setRecords((prev) => [mapped, ...prev]);
      setStatus({ type: 'success', message: '401k record added.' });

      const totalContribution = mapped.employee_contribution + mapped.employer_contribution;
      await logActivity('added', '401k' as ActivityRecordType, totalContribution);
    }
  };

  const handleDelete = async (id: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus({ type: 'error', message: 'Please log in to perform this action.' });
      return;
    }
    const existing = records.find((r) => r.id === id);

    const { error } = await supabase
      .from('retirement_401k_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting 401k record:', error);
      setStatus({ type: 'error', message: 'Failed to delete 401k record.' });
      return;
    }

    setRecords((prev) => prev.filter((r) => r.id !== id));
    setStatus({ type: 'success', message: '401k record deleted.' });

    if (existing) {
      const totalContribution = existing.employee_contribution + existing.employer_contribution;
      await logActivity('deleted', '401k' as ActivityRecordType, totalContribution);
    }
  };

  const handleDeleteSelected = async (ids: string[]) => {
    if (!ids.length) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus({ type: 'error', message: 'Please log in to perform this action.' });
      return;
    }
    const toDelete = records.filter((r) => ids.includes(r.id));

    const { error } = await supabase
      .from('retirement_401k_records')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('Error deleting selected 401k records:', error);
      setStatus({ type: 'error', message: 'Failed to delete selected 401k records.' });
      return;
    }

    setRecords((prev) => prev.filter((r) => !ids.includes(r.id)));
    setStatus({ type: 'success', message: 'Selected 401k records deleted.' });

    for (const r of toDelete) {
      const totalContribution = r.employee_contribution + r.employer_contribution;
      await logActivity('deleted', '401k' as ActivityRecordType, totalContribution);
    }
  };

  const handleImport = async (rows: RetirementRecordFormData[]) => {
    if (!rows.length) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus({ type: 'error', message: 'Please log in to perform this action.' });
      return;
    }

    const { data, error } = await supabase
      .from('retirement_401k_records')
      .insert(rows.map((r) => buildPayload(r))) // ✅ includes tax fields
      .select();

    if (error) {
      console.error('Error importing 401k records:', error);
      setStatus({ type: 'error', message: 'Failed to import 401k records.' });
      return;
    }

    const mapped: RetirementRecord[] = data?.map((row: any) => mapRow(row)) ?? [];
    setRecords((prev) => [...mapped, ...prev]);
    setStatus({ type: 'success', message: '401k records imported.' });

    for (const r of mapped) {
      const totalContribution = r.employee_contribution + r.employer_contribution;
      await logActivity('imported', '401k' as ActivityRecordType, totalContribution);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">401k Records</h2>

      {status && (
        <div
          className={`text-sm px-3 py-2 rounded-md border ${
            status.type === 'success'
              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
              : 'border-red-500/40 text-red-400 bg-red-500/5'
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Add / Edit Form */}
        <div className="md:col-span-1">
          <RetirementForm
            onSubmit={handleSubmit}
            initialData={
              editingRecord
                ? {
                    employee_name: editingRecord.employee_name,
                    contribution_date: editingRecord.contribution_date,
                    employee_contribution: editingRecord.employee_contribution,
                    employer_contribution: editingRecord.employer_contribution,
                    notes: editingRecord.notes,
                    // ✅ Pass tax fields through to form when editing
                    employee_tax_line: editingRecord.employee_tax_line,
                    employee_tax_category: editingRecord.employee_tax_category,
                    employer_tax_line: editingRecord.employer_tax_line,
                    employer_tax_category: editingRecord.employer_tax_category,
                  }
                : null
            }
            onCancelEdit={() => setEditingRecord(null)}
          />
        </div>

        {/* Contribution History Table */}
        <div className="md:col-span-2">
          <RetirementTable
            records={records}
            onDelete={handleDelete}
            onEdit={setEditingRecord}
            onImport={handleImport}
            onDeleteSelected={handleDeleteSelected}
            title={isLoading ? 'Loading 401k Records...' : 'Contribution History'}
          />
        </div>
      </div>
    </div>
  );
}