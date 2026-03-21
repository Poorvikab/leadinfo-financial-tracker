import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/activityLogger";
import type { ActivityRecordType } from "@/context/ActivityContext";
import { parseExcelDate } from "@/lib/utils";

export interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  notes: string;
  type: "income" | "expense";
  createdAt: string;

  tax_line?: string | null;
  tax_category?: string | null;
  record_subtype?: string | null;
  is_credit?: boolean;
}

interface TransactionContextType {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => Promise<boolean>;
  updateTransaction: (id: string, updatedTransaction: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  importTransactions: (transactions: Omit<Transaction, "id" | "createdAt">[]) => Promise<boolean>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactions must be used inside TransactionProvider");
  }
  return context;
};

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("financial_records")
      .select("*")
      .order("record_date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } else {
      const mapped: Transaction[] =
        data?.map((row: any) => ({
          id: row.id,
          date: row.record_date,
          category: row.category ?? "",
          amount: Number(row.amount) || 0,
          notes: row.notes ?? "",
          type: row.record_type === "income" ? "income" : "expense",
          createdAt: row.created_at ?? new Date().toISOString(),
          // ✅ MAP NEW FIELDS
          tax_line: row.tax_line ?? null,
          tax_category: row.tax_category ?? null,
          record_subtype: row.record_subtype ?? null,
          is_credit: row.is_credit ?? false,
        })) ?? [];

      setTransactions(mapped);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchTransactions();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
   
  const addTransaction = async (transaction: Omit<Transaction, "id" | "createdAt">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // date is already a YYYY-MM-DD string from the form, store directly
    const formattedDate = transaction.date;

    const payload = {
      record_date: formattedDate,
      record_type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      notes: transaction.notes,

      // ✅ SAFE handling (NO undefined)
      tax_line: transaction.tax_line ?? null,
      tax_category: transaction.tax_category ?? null,
      record_subtype: transaction.record_subtype ?? "standard",
      is_credit: transaction.is_credit ?? false,
    };

    console.log("PAYLOAD TO SUPABASE →", payload);

    const { data, error } = await supabase
      .from("financial_records")
      .insert([payload])
      .select()
      .single();

    console.log("SUPABASE RESPONSE →", data);

    if (error) {
      console.error(error);
      return false;
    }

    const newTransaction: Transaction = {
      id: data.id,
      date: data.record_date,
      category: data.category ?? "",
      amount: Number(data.amount) || 0,
      notes: data.notes ?? "",
      type: data.record_type === "income" ? "income" : "expense",
      createdAt: data.created_at ?? new Date().toISOString(),
      // ✅ MAP NEW FIELDS
      tax_line: data.tax_line ?? null,
      tax_category: data.tax_category ?? null,
      record_subtype: data.record_subtype ?? null,
      is_credit: data.is_credit ?? false,
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    console.log("UPDATED STATE →", newTransaction);

    await logActivity("added", newTransaction.type as ActivityRecordType, newTransaction.amount);

    return true;
  };

  const updateTransaction = async (id: string, updatedTransaction: Partial<Transaction>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const existing = transactions.find((t) => t.id === id);
    if (!existing) return false;

    const merged = { ...existing, ...updatedTransaction };

    // keep date as yyyy-mm-dd string
    const formattedDate = merged.date;

    const { data, error } = await supabase
      .from("financial_records")
      .update({
        record_date: formattedDate,
        record_type: merged.type,
        category: merged.category,
        amount: merged.amount,
        notes: merged.notes,

        // NEW
        tax_line: (merged as any).tax_line || null,
        tax_category: (merged as any).tax_category || null,
        record_subtype: (merged as any).record_subtype || "standard",
        is_credit: (merged as any).is_credit ?? false,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(error);
      return false;
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...merged }
          : t
      )
    );

    await logActivity("updated", merged.type as ActivityRecordType, merged.amount);

    return true;
  };

  const deleteTransaction = async (id: string) => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return false;

    const { error } = await supabase.from("financial_records").delete().eq("id", id);

    if (error) {
      console.error(error);
      return false;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    await logActivity("deleted", existing.type as ActivityRecordType, existing.amount);

    return true;
  };

  
  const importTransactions = async (newTransactions: Omit<Transaction, "id" | "createdAt">[]) => {
    const payload = newTransactions.map((t: any) => ({
      record_date: parseExcelDate(t.date),
      record_type: t.type,
      category: t.category,
      amount: t.amount,
      notes: t.notes,

      tax_line: t.tax_line || null,
      tax_category: t.tax_category || null,
      record_subtype: "imported",
      is_credit: false,
    }));

    const { data, error } = await supabase
      .from("financial_records")
      .insert(payload)
      .select();

    if (error) {
      console.error(error);
      return false;
    }

    const mapped: Transaction[] =
      data?.map((row: any) => ({
        id: row.id,
        date: row.record_date,
        category: row.category ?? "",
        amount: Number(row.amount) || 0,
        notes: row.notes ?? "",
        type: row.record_type === "income" ? "income" : "expense",
        createdAt: row.created_at ?? new Date().toISOString(),

        // ✅ NEW FIELDS
        tax_line: row.tax_line ?? null,
        tax_category: row.tax_category ?? null,
        record_subtype: row.record_subtype ?? null,
        is_credit: row.is_credit ?? false,
      })) ?? [];

    setTransactions((prev) => [...mapped, ...prev]);

    for (const t of mapped) {
      await logActivity("imported", t.type as ActivityRecordType, t.amount);
    }

    return true;
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        isLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};