/**
 * Lightweight analytics abstraction — no third-party vendor, no PII, no DB writes.
 * Register a sink later if you add a provider; until then production is a no-op.
 */

export type AnalyticsEvent =
  | 'landing_view'
  | 'solo_started'
  | 'solo_completed'
  | 'room_created'
  | 'room_joined'
  | 'race_started'
  | 'race_completed'
  | 'quiz_completed'
  | 'rematch_requested'
  | 'rematch_completed'
  | 'result_shared'
  | 'invite_copied';

/** Safe props only — never email, IP, answers, or private room payloads. */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

type AnalyticsSink = (event: AnalyticsEvent, props?: AnalyticsProps) => void;

let sink: AnalyticsSink | null = null;

export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (sink) {
    sink(event, props);
    return;
  }

  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, props ?? {});
  }
}
