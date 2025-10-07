import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ToolCard from '@/components/ToolCard';
import { HABIT_TOOLS } from '@/data/tools';

export default function Home() {
  const featuredTools = HABIT_TOOLS.slice(0, 6);

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      
      {/* Featured Tools Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Featured Habit Tools
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start with these proven techniques that have helped thousands build better habits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/tools"
              className="button-primary inline-flex items-center"
            >
              View All 19 Tools
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our intelligent system matches you with the perfect habit tools for your specific challenges
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Describe Your Challenge</h3>
              <p className="text-gray-300">
                Tell us what&apos;s blocking you from building better habits. Our system understands both English and German.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Matched Tools</h3>
              <p className="text-gray-300">
                Receive personalized tool suggestions with step-by-step instructions and real-world examples.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Start Building Habits</h3>
              <p className="text-gray-300">
                Implement the tools that work best for you and track your progress with our built-in systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Build Better Habits?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of people who have transformed their lives with our proven habit tools
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tools" className="button-primary text-lg px-8 py-4">
              Explore All Tools
            </Link>
            <Link href="/search" className="button-secondary text-lg px-8 py-4">
              Find My Solution
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}