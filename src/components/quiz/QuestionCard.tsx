import { OptionRow } from '@/components/quiz/OptionRow';
import { questionTypeLabel } from '@/data/runOptions';
import type { PassageQuestion } from '@/types/run';

interface QuestionCardProps {
  question: PassageQuestion;
  selectedIndex: number | null;
  onSelect: (optionIndex: number) => void;
}

export function QuestionCard({ question, selectedIndex, onSelect }: QuestionCardProps) {
  return (
    <div className="rounded-lg border-2 border-border bg-surface p-6 shadow-soft sm:p-8">
      <span className="inline-flex rounded-full bg-chip px-3.5 py-1.5 text-[0.72rem] font-bold text-chip-foreground">
        {questionTypeLabel(question.type)}
      </span>

      <h2
        id={`${question.id}-prompt`}
        className="mt-5 max-w-[26ch] font-display text-[clamp(1.6rem,4.5vw,2.5rem)] font-extrabold leading-[0.95] tracking-[-0.025em]"
      >
        {question.prompt}
      </h2>

      {/* Labelled by the visible heading so the question is not announced twice. */}
      <fieldset className="mt-7 sm:mt-9" aria-labelledby={`${question.id}-prompt`}>
        <div className="grid gap-2.5">
          {question.options.map((option, index) => (
            <OptionRow
              key={option}
              name={question.id}
              index={index}
              label={option}
              selected={selectedIndex === index}
              onSelect={() => onSelect(index)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
