import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Comparison } from '../components/Comparison';
import { Pricing } from '../components/Pricing';
import { ComparisonTable } from '../components/ComparisonTable';
import { FAQ } from '../components/FAQ';

export function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Comparison />
      <Pricing />
      <ComparisonTable />
      <FAQ />
    </main>
  );
}
