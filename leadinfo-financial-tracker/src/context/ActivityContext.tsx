import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type ActivityAction = "added" | "updated" | "deleted" | "imported";
export type ActivityRecordType = "income" | "expense" | "401k";

export interface ActivityLog {
  id: string;
  user_email: string;
  action: ActivityAction;
  record_type: ActivityRecordType;
  amount: number | null;
  created_at: string;
}

interface ActivityContextType {
  logs: ActivityLog[];
  isLoading: boolean;
  notification: ActivityLog | null;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const mapRowToActivityLog = (row: any): ActivityLog => ({
  id: row.id,
  user_email: row.user_email ?? "Unknown",
  action: row.action as ActivityAction,
  record_type: row.record_type as ActivityRecordType,
  amount: row.amount != null ? Number(row.amount) : null,
  created_at: row.created_at ?? new Date().toISOString(),
});

export const ActivityProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<ActivityLog | null>(null);

  // ✅ useRef so lastSeenId persists across re-renders and remounts
  const lastSeenIdRef = useRef<string | null>(null);
  // ✅ Fetch current user email once, not every 2 seconds
  const currentEmailRef = useRef<string | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fetch current user once on mount
    const initUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      currentEmailRef.current = userData?.user?.email ?? null;
    };
    void initUser();
  }, []);

  useEffect(() => {
    const pollActivity = async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20); // ✅ Increased from 5 to catch bursts of activity

      if (error || !data) {
        console.error("Error polling activity logs:", error);
        return;
      }

      const currentEmail = currentEmailRef.current;

      // ✅ Filter out own actions for the timeline
      const othersLogs = data
        .filter((row: any) => row.user_email !== currentEmail)
        .map(mapRowToActivityLog);

      // First poll — just set initial state, no notification
      if (!lastSeenIdRef.current) {
        lastSeenIdRef.current = data[0]?.id ?? null;
        setLogs(othersLogs);
        setIsLoading(false);
        return;
      }

      // Check if anything new arrived since last poll
      const lastSeenIndex = data.findIndex((row: any) => row.id === lastSeenIdRef.current);

      // New items are everything before the lastSeenIndex
      const newItems = lastSeenIndex === -1
        ? data // lastSeenId scrolled out of our 20-item window — treat all as new
        : data.slice(0, lastSeenIndex);

      if (newItems.length === 0) return; // Nothing new

      // ✅ Update lastSeenId to the most recent item
      lastSeenIdRef.current = data[0].id;

      // Update timeline with other users' logs
      setLogs(othersLogs);

      // ✅ Only notify for other users' new actions
      const newOthersItems = newItems.filter(
        (row: any) => row.user_email !== currentEmail
      );

      if (newOthersItems.length > 0) {
        // Show the most recent other-user action as notification
        const latest = mapRowToActivityLog(newOthersItems[0]);
        setNotification(latest);

        // Clear any existing timer before setting a new one
        if (notificationTimerRef.current) {
          clearTimeout(notificationTimerRef.current);
        }
        notificationTimerRef.current = setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    };

    void pollActivity();
    const interval = setInterval(pollActivity, 2000);

    return () => {
      clearInterval(interval);
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  return (
    <ActivityContext.Provider value={{ logs, isLoading, notification }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return ctx;
};