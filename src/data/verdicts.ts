interface Verdict {
  /** Minimum comprehension percentage this verdict covers. */
  min: number;
  headline: string;
  note: string;
}

/** Ordered high to low; the first match wins. */
const verdicts: Verdict[] = [
  {
    min: 90,
    headline: 'Big brain moment.',
    note: 'You read it and you kept it.',
  },
  {
    min: 75,
    headline: 'You were locked in.',
    note: 'Strong recall at that pace.',
  },
  {
    min: 60,
    headline: 'Not bad.',
    note: 'The shape was there, some of the detail slipped.',
  },
  {
    min: 40,
    headline: 'Close one.',
    note: 'Speed is ahead of comprehension right now.',
  },
  {
    min: 0,
    headline: 'Yeah... we saw that.',
    note: 'Try one gear slower and see what changes.',
  },
];

export function getVerdict(comprehension: number): Verdict {
  return verdicts.find((verdict) => comprehension >= verdict.min) ?? verdicts[verdicts.length - 1];
}
