import React, { useState } from 'react';
import { useTransactions, Transaction } from '@/context/TransactionContext';
import TransactionForm from '@/components/ui/TransactionForm';
import TransactionTable from '@/components/ui/TransactionTable';

export default function IncomeView() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, importTransactions } = useTransactions();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const incomeTransactions = transactions.filter(t => t.type === 'income');

  // ✅ UPDATED TYPE (important for tax fields)
  const handleSubmit = async (data: any) => {
    if (editingTransaction) {
      const ok = await updateTransaction(editingTransaction.id, data);
      if (ok) {
        setEditingTransaction(null);
        setStatus({ type: 'success', message: 'Income record updated.' });
      } else {
        setStatus({ type: 'error', message: 'Failed to update income record. Please log in to perform this action.' });
      }
    } else {
      const ok = await addTransaction(data);
      if (ok) {
        setStatus({ type: 'success', message: 'Income record added.' });
      } else {
        setStatus({ type: 'error', message: 'Failed to add income record. Please log in to perform this action.' });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteTransaction(id);
    setStatus(
      ok
        ? { type: 'success', message: 'Income record deleted.' }
        : { type: 'error', message: 'Failed to delete income record. Please log in to perform this action.' },
    );
  };

  const handleImport = async (rows: any[]) => {
    const normalized = rows.map((row) => ({
      ...row,
      type: 'income' as const,
    }));

    const ok = await importTransactions(normalized);

    setStatus(
      ok
        ? { type: 'success', message: `${normalized.length} records imported successfully` }
        : {
            type: 'error',
            message: 'Failed to import income records. Please log in to perform this action.',
          },
    );
  };

  const handleDeleteSelected = async (ids: string[]) => {
    const results = await Promise.all(ids.map((id) => deleteTransaction(id)));
    const allOk = results.every(Boolean);

    setStatus(
      allOk
        ? { type: 'success', message: 'Selected income records deleted.' }
        : { type: 'error', message: 'Failed to delete some income records.' },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Income Management</h2>

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
        {/* FORM */}
        <div className="md:col-span-1">
          <TransactionForm 
            type="income" 
            onSubmit={handleSubmit} 
            initialData={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
          />
        </div>

        {/* TABLE */}
        <div className="md:col-span-2">
          <TransactionTable 
            transactions={incomeTransactions} 
            onDelete={handleDelete}
            onEdit={setEditingTransaction}
            onImport={handleImport}
            onDeleteSelected={handleDeleteSelected}
            title="Income History"
          />
        </div>
      </div>
    </div>
  );
}