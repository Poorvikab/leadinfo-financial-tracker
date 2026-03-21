import React, { useState, useMemo } from 'react';
import { useTransactions, Transaction } from '@/context/TransactionContext';
import TransactionForm from '@/components/ui/TransactionForm';
import TransactionTable from '@/components/ui/TransactionTable';

type TypeFilter = 'all' | 'income' | 'expense';

export default function TransactionsView() {
    const { transactions, addTransaction, updateTransaction, deleteTransaction, importTransactions } = useTransactions();

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [tableFilter, setTableFilter] = useState<TypeFilter>('all');

    const filteredTransactions = useMemo(() => {
        if (tableFilter === 'all') return transactions;
        return transactions.filter(t => t.type === tableFilter);
    }, [transactions, tableFilter]);

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
    };

    const handleCancelEdit = () => {
        setEditingTransaction(null);
    };

    const handleSubmit = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
        if (editingTransaction) {
            const ok = await updateTransaction(editingTransaction.id, data);
            if (ok) {
                setEditingTransaction(null);
                setStatus({ type: 'success', message: `${data.type === 'income' ? 'Income' : 'Expense'} record updated.` });
            } else {
                setStatus({ type: 'error', message: 'Failed to update record. Please log in.' });
            }
        } else {
            const ok = await addTransaction(data);
            if (ok) {
                setStatus({ type: 'success', message: `${data.type === 'income' ? 'Income' : 'Expense'} record added.` });
            } else {
                setStatus({ type: 'error', message: 'Failed to add record. Please log in.' });
            }
        }
    };

    const handleDelete = async (id: string) => {
        const ok = await deleteTransaction(id);
        setStatus(
            ok
                ? { type: 'success', message: 'Record deleted.' }
                : { type: 'error', message: 'Failed to delete record. Please log in.' },
        );
    };

    const handleImport = async (rows: Omit<Transaction, 'id' | 'createdAt'>[]) => {
        const ok = await importTransactions(rows);
        setStatus(
            ok
                ? { type: 'success', message: `${rows.length} records imported successfully.` }
                : { type: 'error', message: 'Failed to import records. Please log in.' },
        );
    };

    const handleDeleteSelected = async (ids: string[]) => {
        const results = await Promise.all(ids.map(id => deleteTransaction(id)));
        const allOk = results.every(Boolean);
        setStatus(
            allOk
                ? { type: 'success', message: 'Selected records deleted.' }
                : { type: 'error', message: 'Failed to delete some records.' },
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Transactions</h2>

            {status && (
                <div className={`text-sm px-3 py-2 rounded-md border ${status.type === 'success'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                        : 'border-red-500/40 text-red-400 bg-red-500/5'
                    }`}>
                    {status.message}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">

                {/* ── FORM — type toggle is now the first field inside the form ──── */}
                <div className="md:col-span-1">
                    <TransactionForm
                        onSubmit={handleSubmit}
                        initialData={editingTransaction}
                        onCancelEdit={handleCancelEdit}
                    />
                </div>

                {/* ── TABLE ────────────────────────────────────────────────────────── */}
                <div className="md:col-span-2 space-y-3">

                    {/* Filter pills */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Show:</span>
                        {(['all', 'income', 'expense'] as TypeFilter[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setTableFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tableFilter === f
                                        ? f === 'income'
                                            ? 'bg-green-500/20 text-green-400'
                                            : f === 'expense'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                                        : 'bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                <span className="ml-1.5 opacity-60">
                                    ({f === 'all' ? transactions.length : transactions.filter(t => t.type === f).length})
                                </span>
                            </button>
                        ))}
                    </div>

                    <TransactionTable
                        transactions={filteredTransactions}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onImport={handleImport}
                        onDeleteSelected={handleDeleteSelected}
                        defaultRecordType="expense"
                        title="Transaction History"
                    />
                </div>

            </div>
        </div>
    );
}