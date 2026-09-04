import { categories, difficulties, type Category, type CategoryFilter, type Difficulty } from '@/types/run';

export const difficultyOptions: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'easy', label: 'Easy', hint: 'Warm up' },
  { value: 'medium', label: 'Medium', hint: 'Steady pace' },
  { value: 'hard', label: 'Hard', hint: 'Dense text' },
  { value: 'expert', label: 'Expert', hint: 'No mercy' },
];

const categoryLabels: Record<Category, string> = {
  technology: 'Technology',
  science: 'Science',
  history: 'History',
  psychology: 'Psychology',
  business: 'Business',
  fiction: 'Fiction',
  nature: 'Nature',
  culture: 'Culture',
  philosophy: 'Philosophy',
};

export const categoryOptions: { value: CategoryFilter; label: string }[] = [
  ...categories.map((value) => ({ value: value as CategoryFilter, label: categoryLabels[value] })),
  { value: 'random', label: 'Random' },
];

export function categoryLabel(category: Category): string {
  return categoryLabels[category];
}

export function difficultyLabel(difficulty: Difficulty): string {
  return difficultyOptions[difficulties.indexOf(difficulty)].label;
}
