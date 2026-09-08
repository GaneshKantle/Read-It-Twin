import { useEffect } from 'react';
import { CategoryStack } from '@/components/landing/CategoryStack';
import { Faq } from '@/components/landing/Faq';
import { FeaturedPassage } from '@/components/landing/FeaturedPassage';
import { GamePreview } from '@/components/landing/GamePreview';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PassageCarousel } from '@/components/landing/PassageCarousel';
import { WhyUs } from '@/components/landing/WhyUs';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { track } from '@/lib/analytics';

export function HomePage() {
  useDocumentMeta({
    title: 'Read It Twin',
    description:
      'Read faster. Understand more. Challenge a friend. Read It Twin scores speed and comprehension together. A reading speed and comprehension challenge you can race with a friend.',
    robots: 'index,follow',
  });

  useEffect(() => {
    track('landing_view');
  }, []);

  return (
    <>
      <Hero />
      <PassageCarousel />
      <HowItWorks />
      <CategoryStack />
      <WhyUs />
      <Faq />
      <GamePreview />
      <FeaturedPassage />
    </>
  );
}
