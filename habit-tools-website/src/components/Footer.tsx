'use client';

import Link from 'next/link';
import { Heart, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--notion-border)] py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center gradient-bg">
              <span className="text-lg">⚡</span>
            </div>
            <span className="text-base font-semibold text-[var(--notion-text)]">Habit Toolbox</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors">
              Tools
            </Link>
            <Link href="#process" className="text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors">
              Process
            </Link>
            <Link href="#community" className="text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors">
              Community
            </Link>
            <Link 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[var(--notion-text-secondary)] hover:text-[var(--notion-text)] transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-[var(--notion-text-secondary)] text-xs flex items-center gap-1.5">
            © 2024 Habit Toolbox. Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for better habits.
          </div>
        </div>
      </div>
    </footer>
  );
}

