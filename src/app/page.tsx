import { Suspense } from 'react';
import { CalculatorView } from '@/components/calculator/CalculatorView';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">
            Compound Interest Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Visualize how your money grows over time with the power of compound interest.
            See the difference small regular contributions can make.
          </p>
        </div>
        
        <Suspense fallback={<div className="text-center py-12 dark:text-white">Loading calculator...</div>}>
          <CalculatorView />
        </Suspense>
      </div>
    </main>
  );
}
