import { OptionRow } from '@/components/quiz/OptionRow';
import { Text } from '@/components/ui/Text';
import { questionTypeLabel } from '@/data/runOptions';
import type { PassageQuestion } from '@/types/run';

interface QuestionCardProps {
  question: PassageQuestion;
  selectedIndex: number | null;
  onSelect: (optionIndex: number) => void;
}

export function QuestionCard({ question, selectedIndex, onSelect }: QuestionCardProps) {
  return (
    <div>
      <Text as="p" variant="eyebrow">
        {questionTypeLabel(question.type)}
      </Text>

      <h2
        id={`${question.id}-prompt`}
        className="mt-5 max-w-[26ch] font-display text-[clamp(1.75rem,5vw,3rem)] leading-[1.05] tracking-[-0.035em]"
      >
        {question.prompt}
      </h2>

      {/* Labelled by the visible heading so the question is not announced twice. */}
      <fieldset className="mt-8 sm:mt-10" aria-labelledby={`${question.id}-prompt`}>
        <div className="grid gap-2 sm:gap-3">
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
