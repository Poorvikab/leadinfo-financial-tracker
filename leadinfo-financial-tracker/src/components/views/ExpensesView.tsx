import React, { useState } from 'react';
import { useTransactions, Transaction } from '@/context/TransactionContext';
import TransactionForm from '@/components/ui/TransactionForm';
import TransactionTable from '@/components/ui/TransactionTable';

export default function ExpensesView() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, importTransactions } = useTransactions();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const handleSubmit = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      const ok = await updateTransaction(editingTransaction.id, data);
      if (ok) {
        setEditingTransaction(null);
        setStatus({ type: 'success', message: 'Expense record updated.' });
      } else {
        setStatus({ type: 'error', message: 'Failed to update expense record. Please log in to perform this action.' });
      }
    } else {
      const ok = await addTransaction(data);
      if (ok) {
        setStatus({ type: 'success', message: 'Expense record added.' });
      } else {
        setStatus({ type: 'error', message: 'Failed to add expense record. Please log in to perform this action.' });
      }
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteTransaction(id);
    setStatus(
      ok
        ? { type: 'success', message: 'Expense record deleted.' }
        : { type: 'error', message: 'Failed to delete expense record. Please log in to perform this action.' },
    );
  };

  const handleImport = async (rows: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    // Ensure all imported rows are tagged as expense for this view
    const normalized = rows.map((row) => ({
      ...row,
      type: 'expense' as const,
    }));
    const ok = await importTransactions(normalized);
    setStatus(
      ok
        ? { type: 'success', message: `${normalized.length} records imported successfully` }
        : {
            type: 'error',
            message: 'Failed to import expense records. Please log in to perform this action.',
          },
    );
  };

  const handleDeleteSelected = async (ids: string[]) => {
    const results = await Promise.all(ids.map((id) => deleteTransaction(id)));
    const allOk = results.every(Boolean);
    setStatus(
      allOk
        ? { type: 'success', message: 'Selected expense records deleted.' }
        : { type: 'error', message: 'Failed to delete some expense records.' },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Expense Management</h2>

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
        {/* Add Expense Form */}
        <div className="md:col-span-1">
          <TransactionForm 
            type="expense" 
            onSubmit={handleSubmit} 
            initialData={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
          />
        </div>

        {/* Expense History Table */}
        <div className="md:col-span-2">
          <TransactionTable 
            transactions={expenseTransactions} 
            onDelete={handleDelete}
            onEdit={setEditingTransaction}
            onImport={handleImport}
            onDeleteSelected={handleDeleteSelected}
            title="Expense History"
          />
        </div>
      </div>
    </div>
  );
}
