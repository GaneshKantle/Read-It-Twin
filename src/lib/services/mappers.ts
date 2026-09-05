import type { PassageRow, QuestionPublicRow } from '@/types/database';
import type {
  Category,
  Difficulty,
  Passage,
  PublicPassageQuestion,
  PassageQuestion,
} from '@/types/run';
import { splitParagraphs } from '@/lib/passageContent';

export function mapPassageRow(
  row: PassageRow,
  questions: Array<PublicPassageQuestion | PassageQuestion> = [],
): Passage {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    paragraphs: splitParagraphs(row.content),
    wordCount: row.word_count,
    questions,
  };
}

export function mapPublicQuestion(row: QuestionPublicRow): PublicPassageQuestion {
  return {
    id: row.id,
    type: row.type,
    prompt: row.question,
    options: row.options,
  };
}

export function isPassageQuestion(
  question: PublicPassageQuestion | PassageQuestion,
): question is PassageQuestion {
  return 'answerIndex' in question && typeof question.answerIndex === 'number';
}

export function withAnswerIndexes(
  questions: Array<PublicPassageQuestion | PassageQuestion>,
  grades: { questionId: string; correctAnswerIndex: number }[],
): PassageQuestion[] {
  return questions.map((question) => {
    const grade = grades.find((item) => item.questionId === question.id);
    const answerIndex =
      grade?.correctAnswerIndex ??
      (isPassageQuestion(question) ? question.answerIndex : 0);

    return {
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      answerIndex,
    };
  });
}

export function filterPassages(
  list: Passage[],
  difficulty: Difficulty,
  category: Category | 'random',
): Passage[] {
  const exact = list.filter(
    (passage) =>
      passage.difficulty === difficulty &&
      (category === 'random' || passage.category === category),
  );
  if (exact.length > 0) {
    return exact;
  }

  const byDifficulty = list.filter((passage) => passage.difficulty === difficulty);
  if (byDifficulty.length > 0) {
    return byDifficulty;
  }

  const byCategory = list.filter(
    (passage) => category !== 'random' && passage.category === category,
  );

  return byCategory.length > 0 ? byCategory : list;
}
