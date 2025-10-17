'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--notion-surface)]/95 backdrop-blur-md border-b border-[var(--notion-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center gradient-bg">
              <span className="text-xl">⚡</span>
            </div>
            <span className="text-lg font-semibold group-hover:text-[var(--notion-accent)] transition-colors">Habit Toolbox</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors">
              Tools
            </Link>
            <Link href="#process" className="text-sm text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors">
              Process
            </Link>
            <Link href="#community" className="text-sm text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors">
              Community
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors p-2"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/" 
                className="block px-4 py-2 text-sm text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-surface-hover)] transition-colors rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Tools
              </Link>
              <Link 
                href="#process" 
                className="block px-4 py-2 text-sm text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-surface-hover)] transition-colors rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Process
              </Link>
              <Link 
                href="#community" 
                className="block px-4 py-2 text-sm text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-surface-hover)] transition-colors rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Community
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
