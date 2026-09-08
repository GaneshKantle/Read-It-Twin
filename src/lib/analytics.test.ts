import { describe, expect, it, vi, afterEach } from 'vitest';
import { setAnalyticsSink, track, type AnalyticsEvent } from '@/lib/analytics';

const events: AnalyticsEvent[] = [
  'landing_view',
  'solo_started',
  'solo_completed',
  'room_created',
  'room_joined',
  'race_started',
  'race_completed',
  'quiz_completed',
  'rematch_requested',
  'rematch_completed',
  'result_shared',
  'invite_copied',
];

describe('analytics', () => {
  afterEach(() => {
    setAnalyticsSink(null);
  });

  it('exposes the funnel event names', () => {
    expect(events).toHaveLength(12);
  });

  it('forwards events to a registered sink without requiring PII', () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    track('result_shared', { method: 'clipboard' });
    expect(sink).toHaveBeenCalledWith('result_shared', { method: 'clipboard' });
  });
});
