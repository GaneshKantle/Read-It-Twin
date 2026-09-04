import { CategoryStack } from '@/components/landing/CategoryStack';
import { Faq } from '@/components/landing/Faq';
import { FeaturedPassage } from '@/components/landing/FeaturedPassage';
import { GamePreview } from '@/components/landing/GamePreview';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PassageCarousel } from '@/components/landing/PassageCarousel';
import { WhyUs } from '@/components/landing/WhyUs';

export function HomePage() {
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
