import { GamePreview } from '@/components/landing/GamePreview';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';

export function HomePage() {
  return (
    <>
      <Hero />
      <GamePreview />
      <HowItWorks />
    </>
  );
}
