'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ToolCard from '@/components/ToolCard';
import { HABIT_TOOLS, TOOL_CATEGORIES } from '@/data/tools';
import { Search, Filter, X } from 'lucide-react';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  // Pre-fill from ?q=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTools = useMemo(() => {
    return HABIT_TOOLS.filter(tool => {
      const matchesSearch = searchQuery === '' || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tool.problemPatterns.some(pattern => pattern.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === '' || tool.categories.includes(selectedCategory);
      const matchesDifficulty = selectedDifficulty === '' || tool.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDifficulty('');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedDifficulty;

  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Header */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Smart Tool Search
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Describe your challenge and find the perfect habit tools. Our intelligent system understands 
              both English and German and matches you with the most relevant strategies.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Try: 'combining habits', 'no time', 'low motivation', 'gewohnheiten kombinieren'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 glass-effect rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="button-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-4 button-secondary flex items-center space-x-2 text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="glass-effect rounded-lg p-6 max-w-4xl mx-auto mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full glass-effect rounded-lg px-4 py-2 text-white bg-transparent border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {TOOL_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full glass-effect rounded-lg px-4 py-2 text-white bg-transparent border border-gray-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Difficulties</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="text-center mb-8">
            <p className="text-gray-400">
              {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
              {hasActiveFilters && (
                <span className="ml-2">
                  {searchQuery && `for "${searchQuery}"`}
                  {selectedCategory && ` in ${TOOL_CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
                  {selectedDifficulty && ` (${selectedDifficulty})`}
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">No tools found</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Try adjusting your search terms or filters. You can search in both English and German.
              </p>
              <button
                onClick={clearFilters}
                className="button-primary"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Popular Searches */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Searches</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'combining habits',
              'tracking habits',
              'no time',
              'low motivation',
              'can\'t focus',
              'bad habit',
              'gewohnheiten kombinieren',
              'keine zeit',
              'antriebslos'
            ].map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="glass-effect px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
