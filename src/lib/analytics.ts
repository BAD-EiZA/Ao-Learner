/** Client-safe analytics (no Prisma / node:dns) */

export type AnalyticsName =
  | "placement_complete"
  | "placement_skip"
  | "daily_done"
  | "review_opened"
  | "review_cleared"
  | "stage_attempt"
  | "stage_passed"
  | "stage_failed"
  | "share_score"
  | "leaderboard_opt_in"
  | "leaderboard_opt_out"
  | "study_plan_start"
  | "shadow_start"
  | "roleplay_start"
  | "mic_rejected"
  | "session_recap_view"
  | "locale_change"
  | "reduced_motion_toggle"
  | "match_pairs"
  | "hard_mode_toggle"
  | "offline_queue"
  | "friend_quest_claim"
  | "comeback_claim"
  | "comeback_pending";

/** Fire-and-forget client event → /api/analytics */
export function trackClient(
  name: AnalyticsName,
  props?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ name, props });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics",
        new Blob([body], { type: "application/json" })
      );
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    /* ignore */
  }
}
