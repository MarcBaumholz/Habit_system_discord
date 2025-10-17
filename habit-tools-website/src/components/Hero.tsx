'use client';

import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              Transformiere deine<br />
              Gewohnheiten mit der{' '}
              <span className="gradient-text">Habit Toolbox</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--notion-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Ein systematischer Ansatz für nachhaltige Gewohnheitsbildung. Folge dem bewährten Prozess und nutze unsere Tools für maximalen Erfolg.
            </p>

            {/* Search/Problem Input */}
            <div className="max-w-2xl mx-auto mt-12">
              <h3 className="text-xl font-semibold mb-4 text-[var(--notion-text)]">Was ist dein Gewohnheits-Problem?</h3>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="z.B. Ich möchte regelmäßig Sport treiben..."
                    className="search-input w-full pr-12"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--notion-text-secondary)]" />
                </div>
                <button type="submit" className="button-primary px-6 py-3 whitespace-nowrap text-sm">
                  Lösung finden
                </button>
              </form>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-10 pt-4">
              <Link href="#notion-template" className="button-secondary px-6 py-2.5 text-sm">
                📋 Notion Template
              </Link>
              <Link href="#process" className="button-secondary px-6 py-2.5 text-sm">
                🚀 Process ansehen
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
