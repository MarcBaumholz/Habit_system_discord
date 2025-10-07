import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ToolCard from '@/components/ToolCard';
import { HABIT_TOOLS, TOOL_CATEGORIES } from '@/data/tools';

export default function ToolsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Header */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              All Habit Tools
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Discover 19 proven strategies to build better habits. Each tool comes with step-by-step instructions, 
              real-world examples, and tips for success.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="glass-effect rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{HABIT_TOOLS.length}</div>
                <div className="text-sm text-gray-400">Total Tools</div>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">{TOOL_CATEGORIES.length}</div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">2</div>
                <div className="text-sm text-gray-400">Languages</div>
              </div>
              <div className="glass-effect rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-400">100%</div>
                <div className="text-sm text-gray-400">Free</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Toolboxes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-16">
            {TOOL_CATEGORIES.map((category) => (
              <Link key={category.id} href={`/search?q=${encodeURIComponent(category.name)}`} className="glass-effect p-6 text-center card-hover block">
                <div className="text-3xl mb-3">{category.emoji ?? '🧩'}</div>
                <h3 className="font-semibold mb-1 text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.description}</p>
                <div className="mt-4 inline-block text-sm text-gray-700">Open toolbox →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Tools */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold">All Tools</h2>
            <div className="flex-1 md:max-w-xl">
              <form action="/search" className="relative">
                <input
                  type="text"
                  name="q"
                  placeholder="Search tools (e.g., combining habits, no time, gewohnheiten kombinieren)"
                  className="w-full glass-effect rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 button-primary px-4 py-2">Search</button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HABIT_TOOLS.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.id}`}>
                <ToolCard tool={tool} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Can't find what you're looking for?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Use our intelligent search to find the perfect tool for your specific challenge
          </p>
          <Link href="/search" className="button-primary text-lg px-8 py-4">
            Smart Search
          </Link>
        </div>
      </section>
    </main>
  );
}
