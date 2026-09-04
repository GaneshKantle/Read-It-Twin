import { useContext } from 'react';
import { RunContext } from '@/app/providers/RunProvider';

export function useRun() {
  const context = useContext(RunContext);

  if (!context) {
    throw new Error('useRun must be used within RunProvider');
  }

  return context;
}
