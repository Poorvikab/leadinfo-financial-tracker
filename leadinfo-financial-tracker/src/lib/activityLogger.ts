import { supabase } from "@/lib/supabaseClient";
import type { ActivityAction, ActivityRecordType } from "@/context/ActivityContext";

export async function logActivity(
  action: ActivityAction,
  recordType: ActivityRecordType,
  amount?: number
) {
  const { data } = await supabase.auth.getUser();

  const user = data?.user;

  if (!user) return;

  const { error } = await supabase.from("activity_logs").insert({
    user_email: user.email,
    action: action,
    record_type: recordType,
    amount: amount ?? null,
  });

  if (error) {
    console.error("Activity log error:", error);
  }
}